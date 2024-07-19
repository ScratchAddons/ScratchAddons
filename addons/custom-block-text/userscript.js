import { updateAllBlocks } from "../custom-block-shape/update-all-blocks.js";
import { clearTextWidthCache } from "../middle-click-popup/module.js";

export default async function ({ addon, console }) {
  let currentTextSize = 100;

  const vm = addon.tab.traps.vm;
  const blocklyInstance = await addon.tab.traps.getBlockly();

  // Handling the CSS from here instead of a userstyle is much more stable, as
  // there's no code outside of this addon dynamically toggling the styles.
  // This way, we can clearly control the execution order of style operations.
  // For example, we always want to call updateAllBlocks() after the styles
  // were updated according to the user's settings, not before.
  const fontSizeCss = document.createElement("style");
  // Be careful with specificity because we're adding this userstyle manually
  // to the <head> without checking if other styles are above or below.
  fontSizeCss.textContent = `
    .blocklyText,
    .blocklyHtmlInput {
      font-size: calc(var(--customBlockText-sizeSetting) * 0.12pt) !important;
    }
    .blocklyFlyoutLabelText {
      font-size: calc(var(--customBlockText-sizeSetting) * 0.14pt) !important;
    }`;
  fontSizeCss.disabled = true;
  document.head.appendChild(fontSizeCss);
  //
  const boldCss = document.createElement("style");
  boldCss.textContent = `
    .blocklyText,
    .blocklyHtmlInput {
      font-weight: bold;
    }`;
  boldCss.disabled = true;
  document.head.appendChild(boldCss);
  //
  const textShadowCss = document.createElement("style");
  textShadowCss.textContent = `
    .blocklyDraggable > .blocklyText,
    .blocklyDraggable > g > text {
      text-shadow: 1px 1px 0 rgba(0, 0, 0, 0.4);
    }`;
  textShadowCss.disabled = true;
  document.head.appendChild(textShadowCss);

  const updateBlockly = () => {
    blocklyInstance.Field.cacheWidths_ = {}; // Clear text width cache
    // If font size has changed, middle click popup needs to clear it's cache too
    clearTextWidthCache();

    updateAllBlocks(vm, addon.tab.traps.getWorkspace(), blocklyInstance);
  };

  const setFontSize = (wantedSize) => {
    if (wantedSize !== 100) document.documentElement.style.setProperty("--customBlockText-sizeSetting", wantedSize);

    if (wantedSize === 100) {
      fontSizeCss.disabled = true;
      currentTextSize = 100;
      return;
    } else if (wantedSize === currentTextSize) return;

    currentTextSize = wantedSize;
    fontSizeCss.disabled = false;
  };
  const setBold = (bool) => {
    boldCss.disabled = !bool;
  };
  const setTextShadow = (bool) => {
    textShadowCss.disabled = !bool;
  };

  addon.settings.addEventListener("change", () => {
    setFontSize(addon.settings.get("size"));
    setBold(addon.settings.get("bold"));
    setTextShadow(addon.settings.get("shadow"));
    updateBlockly();
  });

  addon.self.addEventListener("disabled", () => {
    setFontSize(100);
    setBold(false);
    setTextShadow(false);
    updateBlockly();
  });
  addon.self.addEventListener("reenabled", () => {
    setFontSize(addon.settings.get("size"));
    setBold(addon.settings.get("bold"));
    setTextShadow(addon.settings.get("shadow"));
    updateBlockly();
  });

  setFontSize(addon.settings.get("size"));
  setBold(addon.settings.get("bold"));
  setTextShadow(addon.settings.get("shadow"));
  updateBlockly();
}
