import { textColor } from "../../libraries/common/cs/text-color.esm.js";

const dataUriRegex = new RegExp("^data:image/svg\\+xml;base64,([A-Za-z0-9+/=]*)$");

export default async function ({ addon, console }) {
  const Blockly = await addon.tab.traps.getBlockly();

  const oldCategoryCreateDom = Blockly.Toolbox.Category.prototype.createDom;
  Blockly.Toolbox.Category.prototype.createDom = function () {
    if (addon.self.disabled) return oldCategoryCreateDom.call(this);
    if (!this.iconURI_ || !["music", "videoSensing", "text2speech"].includes(this.id_))
      return oldCategoryCreateDom.call(this);

    const match = dataUriRegex.exec(this.iconURI_);
    if (match) {
      const oldSvg = atob(match[1]);
      const newColor = textColor(addon.settings.get("categoryMenu"), null, "#ffffff");
      if (newColor) {
        const newSvg = oldSvg.replace(/#575e75|#4d4d4d/gi, newColor);
        this.iconURI_ = `data:image/svg+xml;base64,${btoa(newSvg)}`;
      }
    }
    oldCategoryCreateDom.call(this);
  };

  const reloadToolbox = () => {
    Blockly.Events.disable();
    const workspace = Blockly.getMainWorkspace();
    const flyout = workspace.getFlyout();
    const toolbox = workspace.getToolbox();
    const flyoutWorkspace = flyout.getWorkspace();
    Blockly.Xml.clearWorkspaceAndLoadFromXml(Blockly.Xml.workspaceToDom(flyoutWorkspace), flyoutWorkspace);
    toolbox.populate_(workspace.options.languageTree);
    Blockly.Events.enable();
  };
  reloadToolbox();
  addon.settings.addEventListener("change", reloadToolbox);
  addon.self.addEventListener("disabled", reloadToolbox);
  addon.self.addEventListener("reenabled", reloadToolbox);
}
