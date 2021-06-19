export default /** @param {Addon.Userscript} */ async ({ addon, console, msg }) => {
  window.location.replace(window.location.href.replace("m/", ""));
};
