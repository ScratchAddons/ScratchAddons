export default async (/** @type {import("../../types").Userscript} */ { addon, console, msg }) => {
  window.location.replace(window.location.href.replace("m/", ""));
};
