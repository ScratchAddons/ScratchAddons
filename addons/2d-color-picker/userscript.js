import paintEditorHandler from "./paint-editor.js";

export default async (api) => {
  const { addon } = api;
  await addon.tab.loadScript("/libraries/thirdparty/cs/tinycolor-min.js");
  paintEditorHandler(api);
};
