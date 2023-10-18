import { textColor } from "../../libraries/common/cs/text-color.esm.js";

const iconSelector = "[class*='labeled-icon-button_edit-field-icon_']";
const dataUriRegex = new RegExp("^data:image/svg\\+xml;base64,([A-Za-z0-9+/=]*)$");

export default async function ({ addon, console }) {
  const recolorSvg = (svg) => {
    return svg
      .replace(/#855cd6/gi, addon.settings.get("highlightText"))
      .replace(/#ffffff|#fff|white/gi, addon.settings.get("accent"))
      .replace(/#575e75/gi, textColor(addon.settings.get("accent")));
  };

  const srcToSvg = async (src) => {
    const match = dataUriRegex.exec(src);
    if (match) return atob(match[1]);
    return await (await fetch(src)).text();
  };

  const updateIcon = async (icon) => {
    let src = icon.src;
    let oldSvg;
    if (icon.saOriginalSvg) {
      oldSvg = icon.saOriginalSvg;
    } else {
      oldSvg = await srcToSvg(src);
    }

    // The icon might change before srcToSvg resolves - it should only be updated if it hasn't
    if (icon.src === src) {
      icon.saOriginalSvg = oldSvg;
      const newSvg = addon.self.disabled ? oldSvg : recolorSvg(oldSvg);
      icon.src = `data:image/svg+xml;base64,${btoa(newSvg)}`;
    }

    // React sometimes changes the src of an existing icon instead of creating a new one
    if (!icon.saOverriddenSetAttribute) {
      icon.saOverriddenSetAttribute = true;
      const oldSetAttribute = icon.setAttribute;
      icon.setAttribute = function (name, value) {
        oldSetAttribute.call(this, name, value);
        if (name === "src") {
          icon.saOriginalSvg = null;
          updateIcon(icon);
        }
      };
    }
  };

  const updateAllIcons = () => {
    for (let icon of document.querySelectorAll(iconSelector)) updateIcon(icon);
  };

  addon.settings.addEventListener("change", updateAllIcons);
  addon.self.addEventListener("disabled", updateAllIcons);
  addon.self.addEventListener("reenabled", updateAllIcons);

  while (true) {
    const icon = await addon.tab.waitForElement(iconSelector, {
      markAsSeen: true,
      reduxEvents: [
        "scratch-gui/navigation/ACTIVATE_TAB",
        "scratch-gui/mode/SET_PLAYER",
        "fontsLoaded/SET_FONTS_LOADED",
        "scratch-gui/locales/SELECT_LOCALE",
        "scratch-gui/targets/UPDATE_TARGET_LIST",
        "scratch-paint/modes/CHANGE_MODE",
      ],
      reduxCondition: (state) => state.scratchGui.editorTab.activeTabIndex === 1 && !state.scratchGui.mode.isPlayerOnly,
    });
    updateIcon(icon);
  }
}
