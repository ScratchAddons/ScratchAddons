/**
 * This file contains block definitions for custom reporters, which are largely the same
 * as the definitions for custom procedures, with opcode changes. It also describes how
 * to patch the VM execution layer in order to execute custom reporters in a way that is
 * consistent with how they will be run when they are transpiled to use vanilla procedures.
 *
 * The way we go about this is by peeking at the inputs of the next block to come before
 * that block is executed, and for each custom reporter call in any inputs, create a fake
 * stack block that points to the next block correctly (which may well be another fake
 * procedure call). Then when the actual reporter calls appear, we execute those as a simple
 * variable access. Easy, right?? ...Right?
 *
 * This will probably have a small performance impact from creating the fake blocks and
 * then removing them (i think they do need to be removed? otherwise they might end up
 * showing up somewhere at some point), but that's fine for an initial proof of concept.
 */

import { uid } from "./util.js";

export class ScratchAddonsProcedureBlocks {
  constructor(runtime) {
    /**
     * The runtime instantiating this block package.
     * @type {Vm.Runtime}
     */
    this.runtime = runtime;
  }

  static polluteStackFrame(StackFrame) {
    if (StackFrame._sa_polluted) {
      return;
    }
    // console.log("StackFrame not yet polluted, polluting now");
    StackFrame._sa_polluted = true;

    const oldReset = StackFrame.reset;
    /** wrapper around original function to clean up polluted stack frames */
    StackFrame.reset = function () {
      oldReset.call(this);
      this._sa_proper_call = false;
    };
  }

  static polluteThread(Thread) {
    if (Thread._sa_polluted) {
      return;
    }
    console.log("thread not yet polluted, polluting now");
    Thread._sa_polluted = true;

    /** adaptation of original function to account for new opcodes */
    Thread.stopThisScript = function () {
      console.log("stopping script... (%i items on the stack)", this.stack.length);
      let blockID = this.peekStack();
      while (blockID !== null) {
        const block = this.target.blocks.getBlock(blockID);
        console.log(block.opcode);
        if (
          typeof block !== "undefined" &&
          (block.opcode === "procedures_call" ||
            block.opcode === "procedures_call_reporter" ||
            block.opcode === "procedures_call_boolean")
        ) {
          break;
        }
        this.popStack();
        blockID = this.peekStack();
      }

      if (this.stack.length === 0) {
        this.requestScriptGlowInFrame = false;
        this.status = Thread.STATUS_DONE;
      }
    };

    /**
     *  Adds reporter calls inside this block's inputs. Modifies the calls array in place.
     * @param {Array<object>} calls - the calls array to mutate
     * @param {object} outerBlock
     */
    Thread._pushProcReporterCalls = function (calls, outerBlock) {
      for (const { block } of Object.values(this.target.blocks.getInputs(outerBlock) ?? {})) {
        const inputBlock = this.target.blocks.getBlock(block);
        // console.log("input opcode: %s", inputBlock.opcode);
        if (inputBlock.opcode === "procedures_call_reporter" || inputBlock.opcode === "procedures_call_boolean") {
          calls.push(inputBlock);
        }
        this._pushProcReporterCalls(calls, inputBlock);
      }
    };

    /**
     * Sets up fake procedure calls for custom reporters
     * @param {string} outerBlockId - The ID of the block to analyse
     * @param {object} outerBlock - The block to analyse
     * @returns string - the id of the block to push on to the stack next
     */
    Thread.pushProcReporterCalls = function (outerBlockId, outerBlock) {
      console.log("calling pushprocreportercalls");
      const calls = [];
      this._pushProcReporterCalls(calls, outerBlock);
      calls.reverse();
      const uuids = Array.from({ length: calls.length }, uid);
      uuids.push(outerBlockId);
      for (let i = 0; i < calls.length; i++) {
        this.target.blocks._blocks[uuids[i]] = Object.assign(structuredClone(calls[i]), {
          id: uuids[i],
          next: uuids[i + 1],
          __sa_proper_call: true,
        });
      }
      console.log(outerBlockId, uuids[0], this.target.blocks._blocks[uuids[0]]);
      return uuids[0];
    };

    Thread.peekStack = function () {
      if (this.stack.length > 0 && this.stack.at(-1) !== null) {
        ScratchAddonsProcedureBlocks.polluteStackFrame(this.peekStackFrame().constructor.prototype);
        let currentId = this.stack.at(-1);
        if (this.peekStackFrame().__sa_inspected) {
          return currentId;
        }
        if (!(currentId in this.target.blocks._blocks)) {
          return currentId;
        }
        let currentBlock = this.target.blocks.getBlock(currentId);
        if (currentBlock.__sa_proper_call) {
          return currentId;
        }
        const newId = this.pushProcReporterCalls(currentId, currentBlock);
        // this.reuseStackForNextBlock(newId);
        this.stack[this.stack.length - 1] = newId; // we don't want to reuseStackForNextBlock because we'll lose information like looping
        let newBlock = this.target.blocks.getBlock(newId);
        if (newBlock.__sa_proper_call) {
          this.peekStackFrame().__sa_proper_call = true;
          this.peekStackFrame().__sa_inspected = true;
        }
        return this.stack.at(-1);
      } else {
        return null;
      }
    };

    /** adaptation of existing function to account for new opcodes */
    Thread.isRecursiveCall = function (procedureCode) {
      let callCount = 5; // Max number of enclosing procedure calls to examine.
      const sp = this.stack.length - 1;
      for (let i = sp - 1; i >= 0; i--) {
        const block = this.target.blocks.getBlock(this.stack[i]);
        if (
          (block.opcode === "procedures_call" ||
            block.opcode === "procedures_call_reporter" ||
            block.opcode === "procedures_call_boolean") &&
          block.mutation.proccode === procedureCode
        ) {
          return true;
        }
        if (--callCount < 0) return false;
      }
      return false;
    };
  }

  /**
   * Retrieve the block primitives implemented by this package.
   * @return {object.<string, Function>} Mapping of opcode to Function.
   */
  getPrimitives() {
    return {
      procedures_definition_reporter: this.definition,
      procedures_definition_boolean: this.definition,
      procedures_call_reporter: this.call,
      procedures_call_boolean: this.call,
      procedures_return_reporter: this.return,
      procedures_return_boolean: this.return,
    };
  }

  definition() {
    // No-op: execute the blocks.
  }

  call(args, util) {
    /// adapted from https://github.com/scratchfoundation/scratch-vm/blob/develop/src/blocks/procedures.js

    // console.log(util.thread.stack.length);
    const procedureCode = args.mutation.proccode;
    const paramNamesIdsAndDefaults = util.getProcedureParamNamesIdsAndDefaults(procedureCode);
    if (util.stackFrame._sa_proper_call || util.target.blocks.getBlock(util.thread.peekStack())?.__sa_proper_call) {
      if (!util.stackFrame.executed) {
        // console.log("got proper call");

        if (paramNamesIdsAndDefaults === null) {
          return;
        }

        const [paramNames, paramIds, paramDefaults] = paramNamesIdsAndDefaults;

        util.initParams();
        for (let i = 0; i < paramIds.length; i++) {
          if (Object.prototype.hasOwnProperty.call(args, paramIds[i])) {
            util.pushParam(paramNames[i], args[paramIds[i]]);
          } else {
            util.pushParam(paramNames[i], paramDefaults[i]);
          }
        }
        util.stackFrame.executed = true;
        util.startProcedure(procedureCode);
      } else {
        // console.log("got proper call, but it was already executed");
        if (paramNamesIdsAndDefaults === null) {
          return "";
        }
        const target = util.target;
        const proccode = args.mutation.proccode;
        const variableInfo = target.getReturnVar(proccode);
        const variable = target.lookupOrCreateVariable(variableInfo.id, variableInfo.value);
        return variable.value;
      }
    } else {
      // console.log("got non-proper call");
      if (paramNamesIdsAndDefaults === null) {
        return "";
      }
      const target = util.target;
      const proccode = args.mutation.proccode;
      const variableInfo = target.getReturnVar(proccode);
      const variable = target.lookupOrCreateVariable(variableInfo.id, variableInfo.value);
      return variable.value;
    }
  }

  return(args, util) {
    // console.log("returned!", util.stackFrame._sa_inputs_inspected, util.stackFrame._sa_proper_call);
    const thisId = util.thread.peekStack();
    const target = util.target;
    const blocks = target.blocks._blocks;
    const proccode =
      blocks[blocks[target.blocks.getTopLevelScript(thisId)].inputs.custom_block.block].mutation.proccode;
    const variableInfo = target.getReturnVar(proccode);
    const variable = util.target.lookupOrCreateVariable(variableInfo.id, variableInfo.value);
    variable.value = args.return_value;
    util.stopThisScript();
  }
}
