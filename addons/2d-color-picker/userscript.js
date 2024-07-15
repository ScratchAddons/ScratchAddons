import paintEditorHandler from "./paint-editor.js";

export default async ({ addon, fetch }) => {
  const { addon, fetch } = api;
  await addon.tab.loadScript("/libraries/thirdparty/cs/tinycolor-min.js");
  paintEditorHandler(api);
};
