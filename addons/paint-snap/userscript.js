import { isSelectTool, updateSelectTool } from "./updateSelectTool.js";
import { enable, disable } from "./state.js";
import { initUI } from "./ui.js";

/** @type {(api: import("../../addon-api/content-script/typedef").UserscriptUtilities) => Promise<void>} */
export default async function (api) {
  const { addon } = api;
  addon.self.addEventListener("disabled", disable);
  addon.self.addEventListener("reenabled", enable);
  const paper = await addon.tab.traps.getPaper();
  const [tool] = paper.tools;
  if (isSelectTool(tool)) {
    updateSelectTool(paper, tool, addon.settings);
  }
  initUI(api);
}
