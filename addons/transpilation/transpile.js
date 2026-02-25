/**
 * Defines transpilation schemes for custom reporters
 */

import { getStackBlock, uid, blocksAreDeeplyEqual, blockMatchesMap, isShadow } from "./util.js";

/**
 * Transpiles blocks to/from vanilla/SA, plus patches the vm to be able to run these new blocks
 */
export class Transpiler {
  constructor(vm, blockDefinitions) {
    this.vm = vm;
    this.blockDefinitions = blockDefinitions;
  }

  init() {
    if (!this.vm.editingTarget) {
      throw new Error("editingTarget must be ready before Transpiler#init is called");
    }
    this.vm.editingTarget.blocks.constructor.prototype.getStackBlock = getStackBlock;
    this.vm.editingTarget.blocks.constructor.prototype.blocksAreDeeplyEqual = blocksAreDeeplyEqual;
    this.vm.editingTarget.blocks.constructor.prototype.blockMatchesMap = blockMatchesMap;
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
        //transpilerThis.transpileTargetToSA(this.editingTarget, false);
      }
      return json;
    };
    const blockDefinitions = this.blockDefinitions;
    const registerBlockPackages = this.vm.runtime.constructor.prototype._registerBlockPackages;
    this.vm.runtime.constructor.prototype._registerBlockPackages = function () {
      registerBlockPackages.call(this);
      function infoToFunc({ opcode, inputs, fields }, topArgs) {
        return (args, util) =>
          util.runtime._primitives[opcode]?.(
            Object.fromEntries(
              Object.entries(inputs || {}).map(([name, info]) => {
                return [name, typeof info === "string" ? topArgs[info] : infoToFunc(info, topArgs)(args, util)];
              })
            ),
            util
          ) || fields?.[Object.keys(fields || {})[0]]?.value; // this won't work if the field is a variable. fix it if you need it!
      }
      for (const [opcode, { map }] of Object.entries(blockDefinitions)) {
        this._primitives[opcode] = function (args, util) {
          return infoToFunc(map[0], args)(args, util);
        };
      }
    };
    this.vm.runtime._registerBlockPackages();
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
  _createBlock(mapping, parent, topInputs, blocks) {
    const id = uid();
    console.log(mapping);
    const block = {
      opcode: mapping.opcode,
      id,
      parent,
      next: null,
      topLevel: false,
      shadow: isShadow(mapping.opcode),
      fields: Object.fromEntries(
        Object.entries(mapping.fields || {}).map(([name, { value, id }]) => [name, { name, value, id }])
      ),
      inputs: Object.fromEntries(
        Object.entries(mapping.inputs || {}).map(([name, map]) => {
          const input =
            typeof map === "string" ? topInputs[map] : { name, block: this._createBlock(map, id, topInputs, blocks) };
          if (isShadow(blocks[input.block].opcode)) input.shadow = input.block;
          return [name, input];
        })
      ),
    };
    blocks[id] = block;
    return id;
  }

  _toVanilla(target, shouldEmitWorkspaceUpdate = true) {
    console.log("tovanilla");
    const blocks = target.blocks._blocks;
    for (const blockid in blocks) {
      const block = blocks[blockid];
      if (block.opcode in this.blockDefinitions) {
        let map = this.blockDefinitions[block.opcode].map[0];
        let inputs = { ...block.inputs };
        block.inputs = {};
        block.opcode = map.opcode;
        let currentBlock = block;
        for (const [name, mapping] of Object.entries(map.inputs)) {
          if (typeof mapping === "string") {
            currentBlock.inputs[name] = { block: inputs[mapping].block, name };
            blocks[inputs[mapping].block].parent = currentBlock.id;
          } else {
            let newId = this._createBlock(mapping, currentBlock.id, inputs, blocks);
            currentBlock.inputs[name] = {
              name,
              block: newId,
              shadow: isShadow(blocks[newId].opcode) ? newId : undefined,
            };
          }
        }
        for (const [name, { value, id }] of Object.entries(map.fields || {})) {
          block.fields[name] = { name, value, id };
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
    console.log(target.blocks);
    for (const blockid in blocks) {
      const block = blocks[blockid];
      $blockDefLoop: for (const opcode in this.blockDefinitions) {
        for (const map of this.blockDefinitions[opcode].map) {
          let maybeMatchedInputs = target.blocks.blockMatchesMap(block, map);
          if (typeof maybeMatchedInputs === "object") {
            block.opcode = opcode;
            block.inputs = {};
            for (const [name, blockid] of Object.entries(maybeMatchedInputs)) {
              console.log(blockid, blocks);
              if (!block.inputs) block.inputs = {};
              if (!block.inputs[name]) block.inputs[name] = { name };
              block.inputs[name].block = blockid;
              blocks[blockid].parent = block.id;
            }
            break $blockDefLoop;
          }
        }
      }
    }
    if (shouldEmitWorkspaceUpdate) {
      this.vm.emitWorkspaceUpdate();
    }
  }
}
