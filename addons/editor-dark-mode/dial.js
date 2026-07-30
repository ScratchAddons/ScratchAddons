import { textColor, multiply, alphaBlend } from "../../libraries/common/cs/text-color.esm.js";

const iconSelector = "img[class*='dial_']";
const dataUriRegex = new RegExp("^data:image/svg\\+xml;base64,([A-Za-z0-9+/=]*)$");

export default async function ({ addon, console }) {
  const recolorSvg = (svg) => {
    return svg
      .replace(/#855cd6/gi, "%primary1%")
      .replace(/#a071fe/gi, "%primary2%")
      .replace(/#ccb3ff/gi, "%primary3%")
      .replace(/#ffffff|#fff|white/gi, "%white%")
      .replace(/#000000|#000|black/gi, "%black%")
      .replace(/%primary1%/g, addon.settings.get("primary"))
      .replace(
        /%primary2%/g,
        alphaBlend(addon.settings.get("input"), multiply(addon.settings.get("primary"), { a: 0.7 }))
      )
      .replace(
        /%primary3%/g,
        alphaBlend(addon.settings.get("input"), multiply(addon.settings.get("primary"), { a: 0.375 }))
      )
      .replace(/%white%/g, textColor(addon.settings.get("primary")))
      .replace(/%black%/g, textColor(addon.settings.get("input"), "black"));
  };

  const updateIcon = async (icon) => {
    let svg;
    if (icon.saOriginalSvg) svg = icon.saOriginalSvg;
    else {
      const match = dataUriRegex.exec(icon.src);
      if (!match) return;
      svg = icon.saOriginalSvg = atob(match[1]);
    }
    svg = addon.self.disabled ? svg : recolorSvg(svg);
    icon.src = `data:image/svg+xml;base64,${btoa(svg)}`;
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
      reduxCondition: (state) => !state.scratchGui.mode.isPlayerOnly,
    });
    updateIcon(icon);
  }
}
