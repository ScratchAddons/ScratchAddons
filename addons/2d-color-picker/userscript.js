import paintEditorHandler from "./paint-editor.js";

export default /** @param {Addon.Userscript} */ async ({ addon, console }) => {
  await addon.tab.loadScript(addon.self.lib + "/thirdparty/cs/tinycolor-min.js");
  paintEditorHandler(api);
};
