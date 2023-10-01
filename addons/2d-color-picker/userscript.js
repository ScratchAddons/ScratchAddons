import paintEditorHandler from "./paint-editor.js";

/** @typedef {import("types").Types} Types @param {Types} */
export default async (api) => {
  const { addon } = api;
  await addon.tab.loadScript(addon.self.lib + "/thirdparty/cs/tinycolor-min.js");
  paintEditorHandler(api);
};
