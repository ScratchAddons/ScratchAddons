import paintEditorHandler from "./paint-editor.js";

export default async (/** @type {import("../../types").Injectable} */ api) => {
  await api.addon.tab.loadScript(api.addon.self.lib + "/thirdparty/cs/tinycolor-min.js");
  paintEditorHandler(api);
};
