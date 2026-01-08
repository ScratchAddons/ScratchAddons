/**
 * Defines transpilation schemes for custom reporters
 */

import { getStackBlock, getReturnVar, uid } from "../util.js";

/**
 * Base transpiler class, to be extended for each transpilation scheme
 */
export class Transpiler {
  constructor(vm) {
    this.vm = vm;
  }

  init(blockPackage) {
    if (!this.vm.editingTarget) {
      throw new Error("editingTarget must be ready before Transpiler#init is called");
    }

    this.vm.editingTarget.blocks.constructor.prototype.getStackBlock = getStackBlock;
    this.vm.editingTarget.constructor.prototype.getReturnVar = getReturnVar;

    this.transpileTargetToSA(this.vm.editingTarget);

    const setEditingTarget = this.vm.constructor.prototype.setEditingTarget;
    const transpilerThis = this;
    this.vm.constructor.prototype.setEditingTarget = function (targetId) {
      setEditingTarget.call(this, targetId);
      transpilerThis.transpileTargetToSA(this.editingTarget);
    };

    const toJSON = this.vm.constructor.prototype.toJSON;
    this.vm.constructor.prototype.toJSON = function (optTargetId) {
      if (optTargetId) {
        const target = this.runtime.getTargetById(optTargetId);
        transpilerThis.transpileTargetToVanilla(target, false);
        const json = toJSON.call(this, optTargetId);
        transpilerThis.transpileTargetToSA(target, false);
        return json;
      }
      for (const target of this.runtime.targets) {
        transpilerThis.transpileTargetToVanilla(target, false);
      }
      const json = toJSON.call(this, optTargetId);
      if (this.editingTarget) {
        transpilerThis.transpileTargetToSA(this.editingTarget, false);
      }
      return json;
    };

    const registerBlockPackages = this.vm.runtime.constructor.prototype._registerBlockPackages;
    this.vm.runtime.constructor.prototype._registerBlockPackages = function () {
      registerBlockPackages.call(this);
      const packageObject = new blockPackage(this);
      const packagePrimitives = packageObject.getPrimitives();
      for (const op in packagePrimitives) {
        if (Object.prototype.hasOwnProperty.call(packagePrimitives, op)) {
          this._primitives[op] = packagePrimitives[op].bind(packageObject);
        }
      }
    };
    this.vm.runtime._registerBlockPackages();

    let runtimePushThread = this.vm.runtime.constructor.prototype._pushThread;
    let polluteThread = this.polluteThread.bind(this);
    this.vm.runtime.constructor.prototype._pushThread = function (id, target, ops) {
      let thread = runtimePushThread.call(this, id, target, ops);
      polluteThread(thread.constructor.prototype);
      return thread;
    };

    polluteBlocks(this.vm.editingTarget.blocks.constructor.prototype);
  }

  transpileTargetToVanilla(target, shouldEmitWorkspaceUpdate = true) {
    if (!target.transpiledToSA) return;
    this._toVanilla(target, (shouldEmitWorkspaceUpdate = true));
    target.transpiledToSA = false;
  }

  transpileTargetToSA(target, shouldEmitWorkspaceUpdate = true) {
    if (target.transpiledToSA) return;
    this._toSA(target, (shouldEmitWorkspaceUpdate = true));
    target.transpiledToSA = true;
  }

  _toVanilla(target, shouldEmitWorkspaceUpdate = true) {
    throw new Error("transpileTargetToVanilla must be overridden by derived class");
  }

  _toSA(target, shouldEmitWorkspaceUpdate = true) {
    throw new Error("transpileTargetToSA must be overridden by derived class");
  }

  pushProcReporterCalls(outerBlockId, outerBlock) {
    throw new Error("pushProcReporterCalls must be overridden by derived class");
  }

  peekStack() {
    throw new Error("peekStack must be overridden by derived class");
  }

  polluteThread(Thread) {
    if (Thread._sa_polluted) {
      return;
    }
    console.log("thread not yet polluted, polluting now");
    Thread._sa_polluted = true;

    /** adaptation of original function to account for new opcodes */
    Thread.stopThisScript = function () {
      // console.log("stopping script... (%i items on the stack)", this.stack.length);
      let blockID = this.peekStack();
      while (blockID !== null) {
        const block = this.target.blocks.getBlock(blockID);
        // console.log(block.opcode);
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

    const pushProcReporterCalls = this.pushProcReporterCalls;
    /**
     * Sets up fake procedure calls for custom reporters
     * @param {string} outerBlockId - The ID of the block to analyse
     * @param {object} outerBlock - The block to analyse
     * @returns string - the id of the block to push on to the stack next
     */
    Thread.pushProcReporterCalls = function (outerBlockId, outerBlock) {
      return pushProcReporterCalls.call(this, outerBlockId, outerBlock);
    };

    const peekStack = this.peekStack;
    Thread.peekStack = function () {
      return peekStack.call(this);
    };

    Thread.polluteStackFrame = polluteStackFrame;

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
}

/**
 * @this{vm.Thread}
 */
function polluteStackFrame(StackFrame) {
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

function polluteBlocks(Blocks) {
  /**
   *  Adds reporter calls inside this block's inputs. Modifies the calls array in place.
   * @param {Array<object>} calls - the calls array to mutate
   * @param {object} outerBlock
   */
  Blocks._pushProcReporterCalls = function (calls, outerBlock) {
    for (const { block } of Object.values(this.getInputs(outerBlock) ?? {})) {
      const inputBlock = this.getBlock(block);
      // console.log("input opcode: %s", inputBlock.opcode);
      if (inputBlock.opcode === "procedures_call_reporter" || inputBlock.opcode === "procedures_call_boolean") {
        calls.push(inputBlock);
      }
      this._pushProcReporterCalls(calls, inputBlock);
    }
  };

  /** adapted from original to account for new opcodes */
  Blocks.getProcedureParamNamesIdsAndDefaults = function (name) {
    const cachedNames = this._cache.procedureParamNames[name];
    if (typeof cachedNames !== "undefined") {
      return cachedNames;
    }
    for (const id in this._blocks) {
      if (!Object.prototype.hasOwnProperty.call(this._blocks, id)) continue;
      const block = this._blocks[id];
      if (
        ["procedures_prototype", "procedures_prototype_reporter", "procedures_prototype_boolean"].includes(
          block.opcode
        ) &&
        block.mutation.proccode === name
      ) {
        const names = JSON.parse(block.mutation.argumentnames);
        const ids = JSON.parse(block.mutation.argumentids);
        const defaults = JSON.parse(block.mutation.argumentdefaults);

        this._cache.procedureParamNames[name] = [names, ids, defaults];
        return this._cache.procedureParamNames[name];
      }
    }
    this._cache.procedureParamNames[name] = null;
    return null;
  };

  /** adapted from original to account for new opcodes */
  Blocks.getProcedureDefinition = function (name) {
    const blockID = this._cache.procedureDefinitions[name];
    if (typeof blockID !== "undefined") {
      return blockID;
    }
    for (const id in this._blocks) {
      if (!Object.prototype.hasOwnProperty.call(this._blocks, id)) continue;
      const block = this._blocks[id];
      if (
        ["procedures_definition", "procedures_definition_reporter", "procedures_definition_boolean"].includes(
          block.opcode
        )
      ) {
        const internal = this._getCustomBlockInternal(block);
        if (internal && internal.mutation.proccode === name) {
          this._cache.procedureDefinitions[name] = id; // The outer define block id
          return id;
        }
      }
    }
    this._cache.procedureDefinitions[name] = null;
    return null;
  };
}
