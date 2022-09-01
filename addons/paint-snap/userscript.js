import { isSelectTool, updateSelectTool } from "./updateSelectTool.js";
import { enable, disable, setEnabled } from "./state.js";
import { initUI } from "./ui.js";

/** @type {(api: import("../../addon-api/content-script/typedef").UserscriptUtilities) => Promise<void>} */
export default async function (api) {
  const { addon } = api;
  setEnabled(await addon.self.getEnabledAddons());
  addon.self.addEventListener("disabled", disable);
  addon.self.addEventListener("reenabled", enable);
  const paper = await addon.tab.traps.getPaper();
  window.paper = paper; //todo remove before push
  const [tool] = paper.tools;
  if (isSelectTool(tool)) {
    updateSelectTool(paper, tool, addon.settings);
  }
  initUI(api);
}
