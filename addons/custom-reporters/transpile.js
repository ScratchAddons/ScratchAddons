/**
 * Defines transpilation schemes for custom reporters
 */

/**
 * Base transpiler class, to be extended for each transpilation scheme
 */
class Transpiler {
  constructor(vm, ScratchBlocks) {
    this.vm = vm;
    this.ScratchBlocks = ScratchBlocks;
    if (this.vm.editingTarget) {
      this.transpileTargetToSA(this.vm.editingTarget);
    }
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
  constructor(vm, ScratchBlocks, getWorkspace) {
    super(vm, ScratchBlocks, getWorkspace);
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
          console.log(block);
          block.inputs.VALUE = block.inputs.return_value;
          block.opcode = "data_setvariableto";
          const proccode =
            blocks[blocks[target.blocks.getTopLevelScript(blockid)].inputs.custom_block.block].mutation.proccode;
          const varname = `_return ${proccode}`;
          let variable = target.lookupVariableByNameAndType(varname);
          if (!variable) {
            variable = {
              value: varname,
              id: this.ScratchBlocks.utils.genUid(),
              variableType: "",
            };
            target.createVariable(variable.id, variable.value, "");
          }
          block.fields.VARIABLE = {
            ...variable,
          };
          delete block.inputs.return_value;
          const nextid = this.ScratchBlocks.utils.genUid();
          blocks[nextid] = {
            id: nextid,
            opcode: "control_stop",
            fields: {
              STOP_OPTION: {
                value: "this script",
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
          console.log(1);
          if (!mutation) break;
          console.log(2);
          const shape = mutation.shape;
          if (!shape) break;
          console.log(3);
          const next = blocks[block.next];
          console.log(
            block,
            next,
            next.opcode,
            next.fields.STOP_OPTION.value,
            target.lookupVariableById(block.fields.VARIABLE.id).name,
            `_return ${mutation.proccode}`
          );
          if (
            next &&
            next.opcode === "control_stop" &&
            next.fields.STOP_OPTION.value === "this script" &&
            target.lookupVariableById(block.fields.VARIABLE.id).name === `_return ${mutation.proccode}`
          ) {
            console.log("transforming return to sa");
            block.inputs.return_value = block.inputs.VALUE;
            block.opcode = `procedures_return_${shape}`;
            delete block.inputs.VALUE;
            delete block.fields.VARIABLE;
            block.next = null;
          }
          break;
        }
      }
    }
    if (shouldEmitWorkspaceUpdate) {
      this.vm.emitWorkspaceUpdate();
    }
  }
}
