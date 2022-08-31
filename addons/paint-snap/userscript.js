import { isSelectTool, updateSelectTool } from "./updateSelectTool.js";
import { enable, disable, setEnabled } from "./state.js";

/** @type {(api: import("../../addon-api/content-script/typedef").UserscriptUtilities) => Promise<void>} */
export default async function ({ addon, console }) {
  setEnabled(await addon.self.getEnabledAddons());
  addon.self.addEventListener("disabled", disable);
  addon.self.addEventListener("reenabled", enable);
  const paper = await addon.tab.traps.getPaper();
  window.paper = paper; //todo remove before push
  const [tool] = paper.tools;
  if (isSelectTool(tool)) {
    updateSelectTool(paper, tool, addon.settings);
  }
}
