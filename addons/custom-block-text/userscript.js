import { updateAllBlocks } from "../custom-block-shape/update-all-blocks.js";

export default async function ({ addon, console }) {
  let currentSize = 100;

  const vm = addon.tab.traps.vm;
  const blocklyInstance = await addon.tab.traps.getBlockly();

  // Handling the CSS from here instead of a userstyle is much more stable, as
  // there's no code outside of this addon dynamically toggling the styles.
  let stylesheet = document.createElement("style");
  stylesheet.textContent = `
    .blocklyText,
    .blocklyHtmlInput {
      font-size: calc(var(--customBlockText-sizeSetting) * 0.12pt) !important;
    }`;
  let stylesheetOnDocument = false;

  const changeFontSize = (wantedSize) => {
    document.documentElement.style.setProperty("--customBlockText-sizeSetting", wantedSize);

    if (wantedSize === 100) {
      stylesheet.remove();
      stylesheetOnDocument = false;
      return;
    }
    else if (wantedSize === currentSize) return;
    currentSize = wantedSize;

    if (!stylesheetOnDocument) {
      document.head.appendChild(stylesheet);
      stylesheetOnDocument = true;
    }

    blocklyInstance.Field.cacheWidths_ = {}; // Clear text width cache
    updateAllBlocks(vm);
  };

  addon.settings.addEventListener("change", () => changeFontSize(addon.settings.get("size")));

  addon.self.addEventListener("disabled", () => changeFontSize(100));
  addon.self.addEventListener("reenabled", () => changeFontSize(addon.settings.get("size")));

  changeFontSize(addon.settings.get("size"));
}
