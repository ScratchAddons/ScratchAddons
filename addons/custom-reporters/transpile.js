/**
 * Defines transpilation schemes for custom reporters
 */

import { getStackBlock, getReturnVar, uid } from "./util.js";
import { ScratchAddonsProcedureBlocks } from "./scratchaddons_procedures.js";

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
    const registerBlockPackages = this.vm.runtime.constructor.prototype._registerBlockPackages;
    this.vm.runtime.constructor.prototype._registerBlockPackages = function () {
      registerBlockPackages.call(this);
      const packageObject = new ScratchAddonsProcedureBlocks(this);
      const packagePrimitives = packageObject.getPrimitives();
      for (const op in packagePrimitives) {
        if (Object.prototype.hasOwnProperty.call(packagePrimitives, op)) {
          this._primitives[op] = packagePrimitives[op].bind(packageObject);
        }
      }
      const eq = this._primitives.operator_equals;
      this._primitives.operator_equals = function (...args) {
        console.log("operator_equals!");
        return eq(...args);
      };
    };
    this.vm.runtime._registerBlockPackages();
    const g = this.vm.runtime.getOpcodeFunction;
    this.vm.runtime.getOpcodeFunction = function (a) {
      console.log(a);
      return g.call(this, a);
    };
    this.vm.editingTarget.blocks.constructor.prototype.getProcedureParamNamesIdsAndDefaults = function (name) {
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
    this.vm.editingTarget.blocks.constructor.prototype.getProcedureDefinition = function (name) {
      const blockID = this._cache.procedureDefinitions[name];
      if (typeof blockID !== "undefined") {
        return blockID;
      }

      for (const id in this._blocks) {
        if (!Object.prototype.hasOwnProperty.call(this._blocks, id)) continue;
        const block = this._blocks[id];
        if (["procedures_definition", "procedures_definition_reporter"].includes(block.opcode)) {
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
}
