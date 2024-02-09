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
 * @typedef VariableInfo
 * @type {Object}
 * @property {string} value - the name of the variable
 * @property {string} id - the ID of the variable
 * @property {string} variableType - the type of the variable (always "") - see https://github.com/scratchfoundation/scratch-vm/blob/7313ce5199f8a3da7850085d0f7f6a3ca2c89bf6/src/engine/variable.js#L49-67
 */

/**
 * Gets or creates the return variable for a custom function, based off of the proccode
 * @this {Vm.Target}
 * @returns {VariableInfo}
 */
export function getReturnVar(proccode) {
  const varname = `_return ${proccode}`;
  const internalVariable = this.lookupVariableByNameAndType(varname);
  let variable;
  if (!internalVariable) {
    variable = {
      value: varname,
      id: uid(),
      variableType: "",
    };
    this.createVariable(variable.id, variable.value, variable.variableType);
  } else {
    variable = {
      value: varname,
      id: internalVariable.id,
      variableType: internalVariable.type,
    };
  }
  console.log(variable);
  return variable;
}
