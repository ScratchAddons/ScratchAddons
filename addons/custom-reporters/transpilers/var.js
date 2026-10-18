import { uid } from "../util.js";
import { Transpiler } from "./base.js";

export class VarTranspiler extends Transpiler {
  constructor(vm) {
    super(vm);
    this.init(VarProcedureBlocks);
  }

  _toVanilla(target, shouldEmitWorkspaceUpdate = true) {
    console.log("tovanilla");
    const blocks = target.blocks._blocks;
    for (const blockid of Object.keys(blocks)) {
      const block = blocks[blockid];
      switch (block.opcode) {
        case "procedures_prototype_reporter": {
          block.opcode = "procedures_prototype";
          block.mutation.shape = "reporter";
          break;
        }
        case "procedures_prototype_boolean": {
          block.opcode = "procedures_prototype";
          block.mutation.shape = "boolean";
          break;
        }
        case "procedures_definition_reporter": {
          block.opcode = "procedures_definition";
          if (!block.mutation) {
            block.mutation = {
              tagName: "mutation",
              children: [],
            };
          }
          block.mutation.shape = "reporter";
          break;
        }
        case "procedures_return_reporter":
        case "procedures_return_boolean": {
          block.inputs.VALUE = block.inputs.return_value;
          block.inputs.VALUE.name = "VALUE";
          block.opcode = "data_setvariableto";
          const proccode =
            blocks[blocks[target.blocks.getTopLevelScript(blockid)].inputs.custom_block.block].mutation.proccode;
          const variable = target.getReturnVar(proccode);
          block.fields.VARIABLE = {
            ...variable,
            name: "VARIABLE",
          };
          delete block.inputs.return_value;
          const nextid = uid();
          blocks[nextid] = {
            id: nextid,
            opcode: "control_stop",
            fields: {
              STOP_OPTION: {
                value: "this script",
                name: "STOP_OPTION",
              },
            },
            next: null,
            topLevel: false,
            parent: blockid,
            shadow: false,
            mutation: {
              tagName: "mutation",
              children: [],
              hasNext: false,
            },
          };
          block.next = nextid;
          break;
        }
        case "procedures_call_reporter":
        case "procedures_call_boolean": {
          // console.log(block)
          if (block.__sa_proper_call || typeof block.next === "string") {
            delete blocks[blockid];
            break;
          }
          const topBlock = target.blocks.getStackBlock(block);
          const previousBlockId = topBlock.parent;
          const previousBlock = blocks[previousBlockId] ?? null;
          const newId = uid();
          const newBlock = {
            ...block,
            id: newId,
            next: topBlock.id,
            parent: previousBlockId,
            opcode: "procedures_call",
          };
          newBlock.mutation.shape = block.opcode.substring("procedures_call_".length);
          blocks[newId] = newBlock;
          topBlock.parent = newId;
          if (previousBlock) {
            previousBlock.next = newId;
          }
          const variable = target.getReturnVar(block.mutation.proccode);
          blocks[blockid] = {
            ...block,
            mutation: undefined,
            inputs: {},
            opcode: "data_variable",
            fields: {
              VARIABLE: {
                ...variable,
                name: "VARIABLE",
              },
            },
          };
          break;
        }
      }
    }
    if (shouldEmitWorkspaceUpdate) {
      this.vm.emitWorkspaceUpdate();
    }
  }

  _toSA(target, shouldEmitWorkspaceUpdate = true) {
    console.log("tosa");
    const blocks = target.blocks._blocks;
    for (const blockid of Object.keys(blocks)) {
      const block = blocks[blockid];
      switch (block.opcode) {
        case "procedures_prototype": {
          if (block.mutation.shape === "reporter") {
            block.opcode = "procedures_prototype_reporter";
          } else if (block.mutation.shape === "boolean") {
            block.opcode = "procedures_prototype_boolean";
          }
          break;
        }
        case "procedures_definition": {
          if (block.mutation?.shape === "reporter") {
            block.opcode = "procedures_definition_reporter";
          }
          break;
        }
        case "data_setvariableto": {
          const mutation =
            blocks[blocks[target.blocks.getTopLevelScript(blockid)].inputs?.custom_block?.block]?.mutation;
          if (!mutation) break;
          const shape = mutation.shape;
          if (!shape) break;
          const next = blocks[block.next];
          if (
            next &&
            next.opcode === "control_stop" &&
            next.fields.STOP_OPTION.value === "this script" &&
            target.lookupVariableById(block.fields.VARIABLE.id).name === target.getReturnVar(mutation.proccode).value
          ) {
            block.inputs.return_value = block.inputs.VALUE;
            block.inputs.return_value.name = "return_value";
            block.opcode = `procedures_return_${shape}`;
            delete block.inputs.VALUE;
            delete block.fields.VARIABLE;
            block.next = null;
          }
          break;
        }
        case "data_variable": {
          const topBlock = target.blocks.getStackBlock(block);
          const previousBlock = blocks[topBlock.parent];
          if (previousBlock?.opcode !== "procedures_call") break;
          const mutation = previousBlock.mutation;
          if (!mutation) break;
          const shape = mutation.shape;
          if (!shape) break;
          const proccode = mutation.proccode;
          if (target.lookupVariableById(block.fields.VARIABLE.id).name !== target.getReturnVar(proccode).value) return;
          blocks[blockid] = {
            ...previousBlock,
            opcode: `procedures_call_${shape}`,
            parent: block.parent,
            next: null,
            topLevel: false,
            id: blockid,
          };
          const previousParentId = previousBlock.parent;
          const previousParent = blocks[previousParentId] ?? null;
          if (previousParent) {
            previousParent.next = topBlock.id;
          }
          topBlock.parent = previousParentId;
          delete blocks[previousBlock.id];
          break;
        }
      }
    }
    if (shouldEmitWorkspaceUpdate) {
      this.vm.emitWorkspaceUpdate();
    }
  }

  /**
   * @this{vm.Thread}
   * @param {string} outerBlockId
   * @param {object} outerBlock
   * @returns {string}
   */
  pushProcReporterCalls(outerBlockId, outerBlock) {
    const calls = [];
    this.target.blocks._pushProcReporterCalls(calls, outerBlock);
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
    return uuids[0];
  }

  /**
   * @this {vm.Thread}
   * @returns string
   */
  peekStack() {
    if (this.stack.length > 0 && this.stack.at(-1) !== null) {
      this.polluteStackFrame(this.peekStackFrame().constructor.prototype);
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
  }
}

class VarProcedureBlocks {
  constructor(runtime) {
    /**
     * The runtime instantiating this block package.
     * @type {Vm.Runtime}
     */
    this.runtime = runtime;
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
