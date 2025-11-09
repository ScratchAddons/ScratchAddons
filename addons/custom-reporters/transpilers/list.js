import { uid } from "../util.js";
import { Transpiler } from "./base.js";

export class ListTranspiler extends Transpiler {
  constructor(vm) {
    super(vm);
    this.init(ListProcedureBlocks);
  }

  _toVanilla(target, shouldEmitWorkspaceUpdate = true) {
    console.log("tovanilla");
    const blocks = target.blocks._blocks;
    for (const blockid in blocks) {
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
          block.inputs.ITEM = block.inputs.return_value;
          block.inputs.ITEM.name = "ITEM";
          block.opcode = "data_addtolist";
          const proccode =
            blocks[blocks[target.blocks.getTopLevelScript(blockid)].inputs.custom_block.block].mutation.proccode;
          const list = target.getReturnVar(proccode, "list");
          block.fields.LIST = {
            ...list,
            name: "LIST",
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

          let call_count = 0;
          let inspecting_id = previousBlockId;
          while (
            blocks[inspecting_id]?.opcode === "procedures_call" &&
            typeof blocks[inspecting_id].mutation.shape === "string"
          ) {
            if (blocks[inspecting_id].mutation.proccode === newBlock.mutation.proccode) {
              call_count += 1;
            }
            inspecting_id = Object.entries(blocks).find((id, b) => b.next === inspecting_id)?.[0];
          }
          const list = target.getReturnVar(block.mutation.proccode, "list");
          const lengthBlock = uid();
          const subtractBlock = uid();
          const numShadow = uid();
          const numShadow2 = uid();
          blocks[numShadow] = {
            id: numShadow,
            opcode: "math_number",
            fields: {
              NUM: {
                name: "NUM",
                value: call_count,
              },
            },
            topLevel: false,
            shadow: true,
          };
          blocks[numShadow2] = {
            id: numShadow,
            opcode: "math_number",
            fields: {
              NUM: {
                name: "NUM",
                value: 5,
              },
            },
            topLevel: false,
            shadow: true,
          };
          blocks[lengthBlock] = {
            id: lengthBlock,
            opcode: "data_lengthoflist",
            fields: {
              LIST: {
                ...list,
                name: "LIST",
              },
            },
            parent: subtractBlock,
            topLevel: false,
          };
          blocks[subtractBlock] = {
            id: subtractBlock,
            opcode: "operator_subtract",
            inputs: {
              NUM1: {
                name: "NUM1",
                block: lengthBlock,
              },
              NUM2: {
                name: "NUM2",
                block: numShadow,
                shadow: numShadow,
              },
            },
            fields: {},
            topLevel: false,
          };
          blocks[blockid] = {
            ...block,
            mutation: undefined,
            inputs: {
              INDEX: {
                name: "INDEX",
                block: subtractBlock,
              },
            },
            opcode: "data_itemoflist",
            fields: {
              LIST: {
                ...list,
                name: "LIST",
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
    const toDelete = [];
    for (const blockid in blocks) {
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
        case "data_addtolist": {
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
            target.lookupVariableById(block.fields.LIST.id).name ===
              target.getReturnVar(mutation.proccode, "list").value
          ) {
            block.inputs.return_value = block.inputs.ITEM;
            block.inputs.return_value.name = "return_value";
            block.opcode = `procedures_return_${shape}`;
            delete block.inputs.ITEM;
            delete block.fields.LIST;
            block.next = null;
          }
          break;
        }
        case "data_itemoflist": {
          console.log("data_itemoflist");
          const topBlock = target.blocks.getStackBlock(block);
          const previousBlock = blocks[topBlock.parent];
          if (previousBlock?.opcode !== "procedures_call") break;
          console.log("satisfied previous block");
          const index = blocks[block.inputs.INDEX.block];
          if (index?.opcode !== "operator_subtract") break;
          console.log("satisfied subtraction child");
          const length = blocks[index.inputs.NUM1.block];
          if (length?.opcode !== "data_lengthoflist") break;
          console.log("satisfied list length");
          if (length.fields.LIST.id !== block.fields.LIST.id) break;
          console.log("satisfied same list");
          const call_num_block = blocks[index.inputs.NUM2.block];
          if (call_num_block?.opcode !== "math_number") break;
          console.log("satisfied other subtraction operand");
          const call_num = call_num_block.fields.NUM.value;
          let call_counter = call_num + 1;
          console.log(call_counter);
          console.log(topBlock);
          let inspecting_id = Object.entries(blocks).find((id, b) => b.next === topBlock.id)?.[0] ?? topBlock.parent;
          let caller = null;
          while (
            blocks[inspecting_id]?.opcode === "procedures_call" &&
            typeof blocks[inspecting_id].mutation.shape === "string" &&
            call_counter > 0
          ) {
            const candidate = blocks[inspecting_id];
            console.log(candidate);
            if (
              target.lookupVariableById(block.fields.LIST.id).name ===
              target.getReturnVar(candidate.mutation.proccode, "list").value
            ) {
              caller = candidate;
              call_counter -= 1;
            }
            inspecting_id = Object.entries(blocks).find((id, b) => b.next === inspecting_id)?.[0] ?? candidate.parent;
            console.log(blocks[inspecting_id]);
          }
          if (call_counter > 0) break;
          console.log("satisfies call found");
          const shape = caller.mutation.shape;
          blocks[blockid] = {
            ...caller,
            opcode: `procedures_call_${shape}`,
            parent: block.parent,
            next: null,
            topLevel: false,
            id: blockid,
          };
          toDelete.push(caller.id);
          break;
        }
      }
    }

    for (const deletee of toDelete) {
      const previousParentId = blocks[deletee].parent;
      const previousParent = blocks[previousParentId] ?? null;
      if (previousParent) {
        previousParent.next = blocks[deletee].next;
      }
      blocks[blocks[deletee].next].parent = previousParentId;
      delete blocks[deletee];
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
    const procCounts = {};
    const uuids = Array.from({ length: calls.length }, uid);
    uuids.push(outerBlockId);
    for (let i = 0; i < calls.length; i++) {
      this.target.blocks._blocks[uuids.at(-i - 2)] = Object.assign(structuredClone(calls[i]), {
        id: uuids.at(-i - 2),
        next: uuids.at(-i - 1),
        __sa_proper_call: true,
      });
      if (calls[i].mutation.proccode in procCounts) {
        procCounts[calls[i].mutation.proccode] += 1;
      } else {
        procCounts[calls[i].mutation.proccode] = 1;
      }
      calls[i].mutation.__sa_call_pos = procCounts[calls[i].mutation.proccode];
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
      let currentBlock = this.target.blocks.getBlock(currentId);
      if (this.peekStackFrame().__sa_inspected) {
        return currentId;
      }
      if (!(currentId in this.target.blocks._blocks)) {
        return currentId;
      }
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

class ListProcedureBlocks {
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
        return;
      }
    }
    // console.log("got non-proper call");
    if (paramNamesIdsAndDefaults === null) {
      return "";
    }
    const target = util.target;
    const proccode = args.mutation.proccode;
    const variableInfo = target.getReturnVar(proccode, "list");
    const variable = target.lookupOrCreateList(variableInfo.id, variableInfo.value);
    return variable.value.at(-args.mutation.__sa_call_pos);
  }

  return(args, util) {
    // console.log("returned!", util.stackFrame._sa_inputs_inspected, util.stackFrame._sa_proper_call);
    const thisId = util.thread.peekStack();
    const target = util.target;
    const blocks = target.blocks._blocks;
    const proccode =
      blocks[blocks[target.blocks.getTopLevelScript(thisId)].inputs.custom_block.block].mutation.proccode;
    const variableInfo = target.getReturnVar(proccode, "list");
    const variable = util.target.lookupOrCreateList(variableInfo.id, variableInfo.value);
    variable.value.push(args.return_value);
    util.stopThisScript();
  }
}
