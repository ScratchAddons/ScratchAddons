// Allowing theme3 and recolor-custom-blocks to communicate

let addons = {};
/**
 * Registers an addon to have shared methods / values
 * @param {Addon} addonObj - the addon object
 * @param {string} addonName - the addon's name
 */
export const registerAddon = (addonObj, addonName) => {
  addons[addonName] = {addonObj: addonObj, methods: {}}
}
/**
 * Gets the value from `addon.self` from a registered addon
 * @param {string} addonName - the addon's name
 * @param {string} value - the requested value
 * @returns {*} - the requested value or null if none exists
 */
export const getAddonValue = (addonName, value) => {
  const addon = addons[addonName];
  if(addon) return addon?.addonObj?.self?.[value];
}
/**
 * Adds a method to be shared
 * @param {string} addonName - the addon's name
 * @param {Function} method - the method being shared
 * @param methodName - the method's name
 */
export const shareMethod = (addonName, method, methodName) => {
  const addon = addons[addonName];
  if(addon) {
    addon.methods[methodName] = method;
  } else {
    throw new Error("Addon " + addonName + "has not been registered")
  }
}
/**
 * Tries to call a registered addon's method
 * @param {string} addonName - the addon's name
 * @param {string} methodName - the name of the shared method
 * @param {*[]} args - everything being passed into `call()`
 * @returns {{return: *, exists: boolean}|{return: null, exists: boolean}} - what was returned from the method, and if the method exists under the specified name
 */
export const callSharedMethod = (addonName, methodName, ...args) => {
  const addon = addons[addonName];
  if(!addon) return {return: null, exists: false}
  const method = addon.methods[methodName]
  return {return: method?.call?.(...args), exists: method !== null}
}
