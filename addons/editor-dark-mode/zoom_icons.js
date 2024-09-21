import { textColor, alphaBlend } from "../../libraries/common/cs/text-color.esm.js";

const XLINK_NS = "http://www.w3.org/1999/xlink";
const iconSelector = ".blocklyZoom > image";

export default async function ({ addon, console }) {
  const recolorSvg = (svg) => {
    const backgroundColor = alphaBlend(addon.settings.get("workspace"), addon.settings.get("palette"));
    const foregroundColor = textColor(backgroundColor);
    return svg
      .replace(/#ffffff|#fff|white/gi, "%background%")
      .replace(/#575e75|#231f20|#000000|#000|black/gi, "%text%")
      .replace(/%background%/g, backgroundColor)
      .replace(/%text%/g, foregroundColor);
  };

  const updateIcon = async (icon) => {
    let svg;
    if (icon.saOriginalSvg) svg = icon.saOriginalSvg;
    else svg = icon.saOriginalSvg = await (await fetch(icon.getAttributeNS(XLINK_NS, "href"))).text();
    svg = addon.self.disabled ? svg : recolorSvg(svg);
    icon.setAttributeNS(XLINK_NS, "xlink:href", `data:image/svg+xml;base64,${btoa(svg)}`);
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
        "scratch-gui/mode/SET_PLAYER",
        "scratch-gui/locales/SELECT_LOCALE",
        "scratch-gui/theme/SET_THEME",
        "fontsLoaded/SET_FONTS_LOADED",
      ],
      reduxCondition: (state) => state.scratchGui.editorTab.activeTabIndex === 0 && !state.scratchGui.mode.isPlayerOnly,
    });
    updateIcon(icon);
  }
}
