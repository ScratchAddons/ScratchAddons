import paintEditorHandler from "./paint-editor.js";

export default async (/** @type {AddonAPIs.Userscript} */ api) => {
  await api.addon.tab.loadScript(api.addon.self.lib + "/thirdparty/cs/tinycolor-min.js");
  paintEditorHandler(api);
};
