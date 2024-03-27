/**
 * Userscripts must default-export an async function
 * that takes this object as a sole argument.
 * Note that this is commonly done by destructuring.
 * @example
 * export default async function({ addon, console, msg }) {
 */
declare type AddonAPI = import("../addon-api/content-script/typedef.js").AddonAPI;
