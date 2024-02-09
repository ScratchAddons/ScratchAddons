/**
 * Defines transpilation schemes for custom reporters
 */

import { getStackBlock, getReturnVar, uid } from "./util.js";

/**
 * Base transpiler class, to be extended for each transpilation scheme
 */
class Transpiler {
  constructor(vm) {
    this.vm = vm;
  }

  init() {
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
    throw new Error("transpileTargetToVanilla must be overriden by derived class");
  }

  _toSA(target, shouldEmitWorkspaceUpdate = true) {
    throw new Error("transpileTargetToSA must be overriden by derived class");
  }
}

export class VarTranspiler extends Transpiler {
  constructor(vm) {
    super(vm);
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
        case "data_variable":
          console.log(block);
      }
    }
    if (shouldEmitWorkspaceUpdate) {
      this.vm.emitWorkspaceUpdate();
    }
  }
}
