/**
 * @param {import("../types").UserscriptUtilities} param0
 */
export default async function ({ addon, global, console, msg }) {
  window.location.replace(window.location.href.replace("m/", ""));
}
