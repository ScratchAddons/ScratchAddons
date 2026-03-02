import codeEditorHandler from "./code-editor.js";
import paintEditorHandler from "./paint-editor.js";

// Load tinycolor here, and execute code after that
// Note that we don't await other scripts (they block!)
export default async (api) => {
  const { addon } = api;
  await addon.tab.loadScript("/libraries/thirdparty/cs/tinycolor-min.js");
  codeEditorHandler(api);
  paintEditorHandler(api);
};
