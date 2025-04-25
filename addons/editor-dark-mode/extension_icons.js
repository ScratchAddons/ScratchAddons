import { textColor } from "../../libraries/common/cs/text-color.esm.js";
import { updateAllBlocks } from "../../libraries/common/cs/update-all-blocks.js";

const dataUriRegex = new RegExp("^data:image/svg\\+xml;base64,([A-Za-z0-9+/=]*)$");

export default async function ({ addon, console }) {
  const Blockly = await addon.tab.traps.getBlockly();

  const recolorIcon = (iconUri, extensionId) => {
    if (addon.self.disabled || !iconUri) return iconUri;

    if (extensionId === "translate") {
      if (iconUri.startsWith("data:image/png")) return iconUri; // not in high contrast mode
      return textColor(addon.settings.get("categoryMenu"), iconUri, addon.self.dir + "/assets/translate_white.svg");
    }

    if (!["music", "videoSensing", "text2speech"].includes(extensionId)) return iconUri;
    const match = dataUriRegex.exec(iconUri);
    if (match) {
      const oldSvg = atob(match[1]);
      const newColor = textColor(addon.settings.get("categoryMenu"));
      const newHighContrastColor = textColor(addon.settings.get("categoryMenu"), "#000000", "#ffffff");
      const newSvg = oldSvg
        .replace(/#575e75|#4d4d4d/gi, "%text%")
        .replace(/#000000|#000|black/gi, "%highContrastText%")
        .replace(/%text%/g, newColor)
        .replace(/%highContrastText%/g, newHighContrastColor);
      return `data:image/svg+xml;base64,${btoa(newSvg)}`;
    }
  };

  if (Blockly.registry) {
    // new Blockly
    const ScratchContinuousCategory = Blockly.registry.getClass(
      Blockly.registry.Type.TOOLBOX_ITEM,
      Blockly.ToolboxCategory.registrationName
    );
    const oldCategoryCreateIconDom = ScratchContinuousCategory.prototype.createIconDom_;
    ScratchContinuousCategory.prototype.createIconDom_ = function () {
      const oldIconUri = this.toolboxItemDef_.iconURI;
      this.toolboxItemDef_.iconURI = recolorIcon(oldIconUri, this.getId());
      const iconElement = oldCategoryCreateIconDom.call(this);
      this.toolboxItemDef_.iconURI = oldIconUri;
      return iconElement;
    };
  } else {
    const oldCategoryCreateDom = Blockly.Toolbox.Category.prototype.createDom;
    Blockly.Toolbox.Category.prototype.createDom = function () {
      this.iconURI_ = recolorIcon(this.iconURI_, this.id_);
      oldCategoryCreateDom.call(this);
    };
  }

  const reloadToolbox = () => {
    updateAllBlocks(addon.tab, {
      updateMainWorkspace: false,
      updateFlyout: false,
      updateCategories: true,
    });
  };
  reloadToolbox();
  addon.settings.addEventListener("change", reloadToolbox);
  addon.self.addEventListener("disabled", reloadToolbox);
  addon.self.addEventListener("reenabled", reloadToolbox);
}
