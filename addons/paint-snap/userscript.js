import { isSelectTool, updateSelectTool } from "./updateSelectTool.js";
import { enable, disable, loadSettings, setGuideColor, toggle } from "./state.js";
import { initUI } from "./ui.js";
import { updateScaleTool } from "./updateScaleTool.js";

/** @type {(api: import("../../addon-api/content-script/typedef").UserscriptUtilities) => Promise<void>} */
export default async function (api) {
  const { addon } = api;
  addon.self.addEventListener("disabled", disable);
  addon.self.addEventListener("reenabled", enable);
  loadSettings(addon);
  const paper = await addon.tab.traps.getPaper();
  const [tool] = paper.tools;

  toggle(addon.settings.get("enable-default"));
  setGuideColor(addon.settings.get("guide-color"));
  addon.settings.addEventListener("change", () => setGuideColor(addon.settings.get("guide-color")));

  if (isSelectTool(tool)) {
    updateSelectTool(paper, tool);
    updateScaleTool(paper, tool);
  }
  initUI(api);
}
