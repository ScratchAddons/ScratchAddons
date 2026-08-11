// uid from https://github.com/scratchfoundation/scratch-vm/blob/develop/src/util/uid.js
/**
 * Legal characters for the unique ID.
 * Should be all on a US keyboard.  No XML special characters or control codes.
 * Removed $ due to issue 251.
 * @private
 */
const soup_ = "!#%()*+,-./:;=?@[]^_`{|}~" + "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

/**
 * Generate a unique ID, from Blockly.  This should be globally unique.
 * 87 characters ^ 20 length > 128 bits (better than a UUID).
 * @return {string} A globally unique ID string.
 */
export const uid = function () {
  const length = 20;
  const soupLength = soup_.length;
  const id = [];
  for (let i = 0; i < length; i++) {
    id[i] = soup_.charAt(Math.random() * soupLength);
  }
  return id.join("");
};

/**
 * Gets the top stack block of a block; if the block is a stack block it returns itself,
 * otherwise it returns the first stack block in the parent tree
 * @this {Vm.Blocks}
 */
export function getStackBlock(block) {
  if (!block.parent) return block;
  if (this.getBlock(block.parent).next === block.id) return block;
  return this.getStackBlock(this.getBlock(block.parent));
}

/**
 * Tests if 2 arrays are deeply equal; throws if there are any non-array objects
 * (yes I know, technically everything's an object but whatever) contained within either array
 * @param {Array} arr1
 * @param {Array} arr2
 * @returns {boolean}
 */
export function arraysAreDeeplyEqual(arr1, arr2) {
  if (!Array.isArray(arr1) || !Array.isArray(arr2)) throw new TypeError("non-array argument");
  if (arr1.length !== arr2.length) return false;
  for (let i = 0; i < arr1.length; i++) {
    const el1 = arr1[i],
      el2 = arr2[i],
      type1 = typeof el1,
      type2 = typeof el2;
    if (type1 !== type2) return false;
    if ((type1 === "object" && !Array.isArray(el1)) || (type2 === "object" && !Array.isArray(el2)))
      throw new TypeError("unexpected object within array");
    if (Array.isArray(el1)) {
      if (!arraysAreEqual(el1, el2)) return false;
      else continue;
    }
    if (el1 !== el2) return false;
  }
}

/**
 * Tests if two VM blocks are equal.
 * Assumes neither blocks are stack blocks, or have any mutations.
 * @this {Vm.Blocks}
 */
export function blocksAreDeeplyEqual(block1, block2) {
  console.log(block1, block2);
  if (block1.opcode !== block2.opcode) return false;
  // same opcode, so assume same field & input names
  for (const f in block1.fields || {}) {
    if (block1.fields[f].value !== block2.fields[f].value || block1.fields[f].id !== block2.fields[f].id) return false;
  }
  for (const i in block1.inputs || {}) {
    if (!this.blocksAreDeeplyEqual(this._blocks[block1.inputs[i].block], this._blocks[block2.inputs[i].block]))
      return false;
  }
  return true;
}

/**
 *
 * @param block
 * @param {import('./block-definitions.js').MapInfo} map
 * @param {string} top - the top block in this recursive call; do not delete this block!
 * @param {Object<string, string>} [inputs={}]
 * @param {string[]} [toDelete=[]]
 * @returns {false|Object<string, string>}
 * @this {Vm.Blocks}
 */
export function blockMatchesMap(block, map, top, inputs = {}, toDelete = []) {
  if (block.opcode !== map.opcode) return false;
  for (const [name, { value, id }] of Object.entries(map.fields || {})) {
    if (block.fields[name].value !== value || block.fields[name].id !== id) return false;
  }
  for (const [name, inputMap] of Object.entries(map.inputs || {})) {
    if (typeof inputMap === "string") {
      if (inputMap in inputs) {
        console.log(name, inputMap, inputs, block);
        if (!this.blocksAreDeeplyEqual(this._blocks[inputs[inputMap]], this._blocks[block.inputs[name].block]))
          return false;
      } else {
        inputs[inputMap] = block.inputs[name].block;
      }
    } else {
      const inputMatch = this.blockMatchesMap(this._blocks[block.inputs[name].block], inputMap, top, inputs, toDelete);
      if (!inputMatch) return false;
    }
  }
  if (block.id !== top) {
    toDelete.push(block.id);
  } else {
    for (const id of toDelete) {
      console.log(this._blocks[id]);
      delete this._blocks[id];
    }
  }
  return inputs;
}

export function isShadow(opcode) {
  return ["text", "math_number"].includes(opcode); // update this list as needed
}
