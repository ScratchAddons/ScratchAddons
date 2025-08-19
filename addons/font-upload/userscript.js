// @ts-check

// @ts-expect-error
import { parse as __parse } from "https://opentype.js.org/dist/opentype.mjs";
import blocks from "./starter.js";

/** @type {import('./opentype.d.ts').parse} */
const parse = __parse;

/**
 * @param {import('../../addon-api/content-script/typedef').UserscriptUtilities} utilities
 */
export default async function ({ addon, msg }) {
  /**
   * @param {File} fontFile
   */
  async function addFontSprite(fontFile) {
    const font = parse(await fontFile.arrayBuffer());
    const fontSize = addon.settings.get("baseFontSize");
    const scale = fontSize / font.unitsPerEm;

    const vm = addon.tab.traps.vm;
    const storage = vm.runtime.storage;

    const advanceWidth = [];
    const costumes = [];

    const round = (x) => +(x + Number.EPSILON).toFixed(4);

    for (let i = 0; i < font.glyphs.length; i++) {
      const glyph = font.glyphs.get(i);

      if (!glyph.unicode && i !== 0) continue;

      advanceWidth.push(round((glyph.advanceWidth ?? 0) * scale));

      const bounds = glyph.getBoundingBox();
      const viewHeight = (bounds.y2 - bounds.y1) * scale;
      const viewWidth = (bounds.x2 - bounds.x1) * scale;

      // weird bug where if path coordinate is almost aligned to grid it will round to NaN
      const episilon = 0.00001;
      const path = glyph.getPath(viewWidth / 2 + episilon, viewHeight / 2 + episilon, fontSize);
      path.fill = "red";
      const pathStr = path.toSVG(4);
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${round(viewWidth / 2 + bounds.x1 * scale)} ${round(
        viewHeight / 2 - bounds.y2 * scale
      )} ${round(viewWidth)} ${round(viewHeight)}">${pathStr}</svg>`;

      const asset = storage.createAsset(
        storage.AssetType.ImageVector,
        storage.DataFormat.SVG,
        new TextEncoder().encode(svg),
        null,
        true
      );

      costumes.push({
        name: glyph.unicode ? String.fromCharCode(glyph.unicode) : "undefined",
        dataFormat: storage.DataFormat.SVG,
        asset,
        md5: `${asset.assetId}.${storage.DataFormat.SVG}`,
        assetId: asset.assetId,
      });
    }

    await vm.addSprite({
      name: font.getEnglishName("fontFamily"),
      isStage: false,
      x: 0,
      y: 0,
      visible: false,
      size: 100,
      rotationStyle: "all around",
      direction: 90,
      draggable: false,
      currentCostume: 0,
      blocks,
      variables: { display_index: ["i", 0] },
      lists: {
        advance_width: ["Advance Width", advanceWidth],
      },
      costumes,
      sounds: [],
    });
    addon.tab.redux.dispatch({
      type: "scratch-gui/navigation/ACTIVATE_TAB",
      activeTabIndex: 0, // blocks tab
    });
  }

  /**
   * @param {(File) => any} onUpload
   * @returns {{ menuitem: HTMLDivElement, tooltip: HTMLDivElement }}
   */
  function createMenuItem(onUpload) {
    const uploadMsg = msg("upload-font");
    const menuitem = document.createElement("div");

    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".otf, .ttf, .woff, .woff2";
    input.classList.add(addon.tab.scratchClass("action-menu_file-input"), "sa-font-upload-input");
    input.multiple = false;
    input.addEventListener("change", () => {
      const file = input.files?.[0];
      if (!file) return;
      onUpload(file);
    });

    const button = document.createElement("button");
    button.dataset.tip = uploadMsg;
    button.classList.add(
      addon.tab.scratchClass("action-menu_button"),
      addon.tab.scratchClass("action-menu_more-button"),
      "sa-font-upload-btn"
    );
    button.addEventListener("click", (e) => {
      e.stopPropagation();
      // clear files
      input.files = new DataTransfer().files;
      input.click();
    });

    const icon = document.createElement("img");
    icon.classList.add(addon.tab.scratchClass("action-menu_more-icon"), "sa-font-upload-icon");
    icon.draggable = false;
    icon.src = `${addon.self.dir}/icon.svg`;
    icon.height = 10;
    icon.width = 10;

    const tooltip = document.createElement("div");
    tooltip.textContent = uploadMsg;
    tooltip.dataset.id = "tooltip";
    tooltip.classList.add(
      addon.tab.scratchClass("action-menu_tooltip"),
      `__react_component_tooltip`,
      "type-dark",
      "sa-font-upload-tooltip",
      "place-left"
    );

    button.append(icon);
    button.append(input);
    menuitem.append(button);
    menuitem.append(tooltip);

    addon.tab.displayNoneWhileDisabled(menuitem);
    return {
      menuitem,
      tooltip,
    };
  }

  await addon.tab.scratchClassReady();
  while (true) {
    const menu = await addon.tab.waitForElement(
      '[class*="sprite-selector_sprite-selector_"] [class*="action-menu_more-buttons_"]',
      {
        markAsSeen: true,
        reduxCondition: (state) => !state.scratchGui.mode.isPlayerOnly,
        reduxEvents: [
          "scratch-gui/mode/SET_PLAYER",
          "fontsLoaded/SET_FONTS_LOADED",
          "scratch-gui/libraries/SET_LIBRARY_FONTS",
          "scratch-gui/navigation/ACTIVATE_TAB",
        ],
      }
    );

    const { menuitem, tooltip } = createMenuItem(addFontSprite);

    // insert before surpise menu item so HD Image Uploads works
    const surpiseButton = document.querySelector('button[aria-label="Surprise"]');
    if (!surpiseButton) continue;
    menu.insertBefore(menuitem, surpiseButton.parentElement);

    const observer = new MutationObserver(() => {
      const rect = menuitem.getBoundingClientRect();
      tooltip.style.top = rect.top + 2 + "px";
      tooltip.style.right = window.innerWidth - rect.right + rect.width + 10 + "px";
    });

    observer.observe(menu, { attributes: true, subtree: true });
  }
}
