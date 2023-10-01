/** @typedef {import("types").Types} Types @param {Types} */
export default async function ({ addon, console, msg }) {
  window.location.replace(window.location.href.replace("m/", ""));
}
