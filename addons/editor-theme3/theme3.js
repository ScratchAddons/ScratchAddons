// TW: This addon very heavily links against TurboWarp/scratch-gui internals and other changes
// There is absolutely no hope that this will run on a scratch.mit.edu environment

import { removeAlpha, multiply, brighten, alphaBlend, textColor } from "../../libraries/common/cs/text-color.esm.js";
import { BLOCKS_CUSTOM, BLOCKS_MAP, defaultBlockColors } from "../../../lib/themes";
import { detectTheme } from "../../../lib/themes/themePersistance";

const extensionsCategory = {
  categoryId: null,
  settingId: "Pen-color",
  colorId: "pen",
};
const saCategory = {
  categoryId: null,
  settingId: "sa-color",
  colorId: "addons",
};
const categories = [
  {
    categoryId: "motion",
    settingId: "motion-color",
    colorId: "motion",
  },
  {
    categoryId: "looks",
    settingId: "looks-color",
    colorId: "looks",
  },
  {
    categoryId: "sound",
    settingId: "sounds-color",
    colorId: "sounds",
  },
  {
    categoryId: "events",
    settingId: "events-color",
    colorId: "event",
  },
  {
    categoryId: "control",
    settingId: "control-color",
    colorId: "control",
  },
  {
    categoryId: "sensing",
    settingId: "sensing-color",
    colorId: "sensing",
  },
  {
    categoryId: "operators",
    settingId: "operators-color",
    colorId: "operators",
  },
  {
    categoryId: "variables",
    settingId: "data-color",
    colorId: "data",
  },
  {
    categoryId: "lists",
    settingId: "data-lists-color",
    colorId: "data_lists",
  },
  {
    categoryId: "myBlocks",
    settingId: "custom-color",
    colorId: "more",
  },
  extensionsCategory,
  saCategory
];

// From scratch-blocks/media/dropdown-arrow.svg
const arrowPath =
  "M6.36,7.79a1.43,1.43,0,0,1-1-.42L1.42,3.45a1.44,1.44,0,0,1,0-2c0.56-.56,9.31-0.56,9.87,0a1.44,1.44,0,0,1,0,2L7.37,7.37A1.43,1.43,0,0,1,6.36,7.79Z";
const arrowShadowPath =
  "M12.71,2.44A2.41,2.41,0,0,1,12,4.16L8.08,8.08a2.45,2.45,0,0,1-3.45,0L0.72,4.16A2.42,2.42,0,0,1,0,2.44,2.48,2.48,0,0,1,.71.71C1,0.47,1.43,0,6.36,0S11.75,0.46,12,.71A2.44,2.44,0,0,1,12.71,2.44Z";
const arrowShadowColor = "#231f20";

export default async function ({ addon, console, msg }) {
  const Blockly = await addon.tab.traps.getBlockly();

  const textMode = () => addon.settings.get("text");
  const isColoredTextMode = () => textMode() === "colorOnWhite" || textMode() === "colorOnBlack";

  const primaryColor = (primary) => {
    if (textMode() === "colorOnWhite") return "#ffffff";
    if (textMode() === "colorOnBlack") return "#282828";
    return primary;
  };

  const secondaryColor = (primary) => {
    if (isColoredTextMode()) return alphaBlend(primaryColor(primary), multiply(primary, { a: 0.15 }));
    if (textMode() === "black") return brighten(primary, { r: 0.6, g: 0.6, b: 0.6 });
    return multiply(primary, { r: 0.9, g: 0.9, b: 0.9 });
  };

  const tertiaryColor = (primary) => {
    if (isColoredTextMode()) return primary;
    if (textMode() === "black") return multiply(primary, { r: 0.65, g: 0.65, b: 0.65 });
    return multiply(primary, { r: 0.8, g: 0.8, b: 0.8 });
  };

  const quaternaryColor = (primary) => {
    if (isColoredTextMode()) return alphaBlend(primaryColor(primary), multiply(primary, { a: 0.25 }));
    if (textMode() === "black") return brighten(primaryColor(primary), { r: 0.4, g: 0.4, b: 0.4 });
    return tertiaryColor(primary);
  };

  const fieldBackground = (object) => {
    // The argument can be a block, field, or primary color
    if (object instanceof Blockly.Block || object instanceof Blockly.Field) {
      const block = object instanceof Blockly.Block ? object : object.sourceBlock_;
      if (isColoredTextMode() || textMode() === "black") {
        let actualPrimary;
        if (block.isShadow() && block.getParent()) {
          actualPrimary = block.getParent().getColour();
        } else {
          actualPrimary = block.getColour();
        }
        if (isColoredTextMode()) return alphaBlend(actualPrimary, multiply(block.getColourTertiary(), { a: 0.25 }));
        return brighten(actualPrimary, { r: 0.4, g: 0.4, b: 0.4 });
      }
      return block.getColourTertiary();
    }
    return quaternaryColor(object);
  };

  const uncoloredTextColor = () => {
    if (textMode() === 'white' || textMode() === 'colorOnBlack') return '#ffffff';
    if (textMode() === 'black' || textMode() === 'colorOnWhite') return '#000000';
    throw new Error(`unknown text mode: ${textMode()}`);
  };

  const textFieldText = () => {
    const black = textMode() === 'black' ? '#000000' : undefined;
    return textColor(addon.settings.get("input-color"), black);
  };

  const fieldTextColor = (field) => {
    if (textMode() === "white") return "#ffffff";
    if (textMode() === "black") return "#000000";
    if (field) return field.sourceBlock_.getColourTertiary();
    return "#000000";
  };

  const categoryIconBackground = (primary) => isColoredTextMode() ? quaternaryColor(primary) : primaryColor(primary);
  const categoryIconBorder = (primary) => tertiaryColor(primary);

  const useBlackIcons = () => textMode() === 'black' || textMode() === 'colorOnWhite';
  const iconPath = () => `/icons/${useBlackIcons() ? "black_text" : "white_text"}`;

  const makeDropdownArrow = (color) => {
    const arrow = Blockly.utils.createSvgElement("g");
    arrow.appendChild(
      Blockly.utils.createSvgElement("path", {
        d: arrowShadowPath,
        fill: arrowShadowColor,
        "fill-opacity": 0.1,
        transform: "translate(0, 1.6)",
      })
    );
    arrow.appendChild(
      Blockly.utils.createSvgElement("path", {
        d: arrowPath,
        fill: color,
        transform: "translate(0, 1.6)",
      })
    );
    return arrow;
  };

  const oldCategoryCreateDom = Blockly.Toolbox.Category.prototype.createDom;
  Blockly.Toolbox.Category.prototype.createDom = function () {
    // Fix color of some category icons
    if (!addon.self.disabled && ["a-b", "videoSensing", "text2speech"].includes(this.id_)) {
      const match = this.iconURI_.match(/^data:image\/svg\+xml;(base64)?,/);
      if (match) {
        const data = this.iconURI_.substring(match[0].length);
        const oldSvg = match[1] === 'base64' ? atob(data) : decodeURIComponent(data);
        const category = this.id_ === "a-b" ? saCategory : extensionsCategory;
        const primary = addon.settings.get(category.settingId);
        const newColor = textMode() === "white" ? primaryColor(primary) : tertiaryColor(primary);
        const newSvg = oldSvg.replace(/#29beb8|#229487|#0ebd8c/gi, newColor);
        this.iconURI_ = `data:image/svg+xml;base64,${btoa(newSvg)}`;
      }
    }

    oldCategoryCreateDom.call(this);

    // Fix color of category bubbles
    if (!addon.self.disabled && !this.iconURI_) {
      const category = categories.find((item) => item.categoryId === this.id_);
      if (category) {
        const primary = addon.settings.get(category.settingId);
        this.bubble_.style.backgroundColor = categoryIconBackground(primary);
        this.bubble_.style.borderColor = categoryIconBorder(primary);
      }
    }
  };

  const oldBlockUpdateColour = Blockly.BlockSvg.prototype.updateColour;
  Blockly.BlockSvg.prototype.updateColour = function () {
    oldBlockUpdateColour.call(this);

    // Fix empty boolean inputs
    if (!addon.self.disabled && isColoredTextMode()) {
      for (const input of this.inputList) {
        if (input.outlinePath) {
          const sourceBlock = this.isShadow() && this.getParent() ? this.getParent() : this;
          const category = categories.find(i => i.categoryId === sourceBlock.category_);
          if (category) {
            input.outlinePath.setAttribute("fill", fieldBackground(addon.settings.get(category.settingId)));
          }
        }
      }
    }
  };

  const oldBlockShowContextMenu = Blockly.BlockSvg.prototype.showContextMenu_;
  Blockly.BlockSvg.prototype.showContextMenu_ = function (e) {
    // Fix hover color of context menus
    if (!addon.self.disabled) {
      Blockly.WidgetDiv.DIV.style.setProperty("--editorTheme3-hoveredItem", fieldBackground(this));
    }

    return oldBlockShowContextMenu.call(this, e);
  };

  const oldFieldLabelInit = Blockly.FieldLabel.prototype.init;
  Blockly.FieldLabel.prototype.init = function () {
    oldFieldLabelInit.call(this);

    // Fix block text in colored text modes
    if (!addon.self.disabled) {
      this.textElement_.style.fill = fieldTextColor(this);
    }
  };

  const oldFieldVariableGetterInit = Blockly.FieldVariableGetter.prototype.init;
  Blockly.FieldVariableGetter.prototype.init = function () {
    oldFieldVariableGetterInit.call(this);

    // Fix color of variable reporters in colored modes
    if (!addon.self.disabled) {
      this.textElement_.style.fill = fieldTextColor(this);
    }
  };

  const oldFieldImageSetValue = Blockly.FieldImage.prototype.setValue;
  Blockly.FieldImage.prototype.setValue = function (src) {
    // Fix black/white images
    if (!addon.self.disabled) {
      const iconsToReplace = ["repeat.svg", "rotate-left.svg", "rotate-right.svg"];
      const iconName = src.split("/")[src.split("/").length - 1];
      if (iconsToReplace.includes(iconName)) {
        src = addon.self.getResource(`${iconPath()}/${iconName}`);
      }
    }

    return oldFieldImageSetValue.call(this, src);
  };

  const oldFieldDropdownInit = Blockly.FieldDropdown.prototype.init;
  Blockly.FieldDropdown.prototype.init = function () {
    oldFieldDropdownInit.call(this);

    if (!addon.self.disabled) {
      // Fix color of the text in the dropdown
      this.textElement_.style.setProperty("fill", fieldTextColor(this), "important");
  
      // Fix dropdown arrow color
      this.arrow_.remove();
      this.arrow_ = makeDropdownArrow(fieldTextColor(this));
  
      // Redraw arrow
      const text = this.text_;
      this.text_ = null;
      this.setText(text);
    }
  };

  const oldFieldDropdownShowEditor = Blockly.FieldDropdown.prototype.showEditor_;
  Blockly.FieldDropdown.prototype.showEditor_ = function () {
    oldFieldDropdownShowEditor.call(this);

    if (!addon.self.disabled) {
      // Dropdown menus
      let primaryColor;
      if (this.sourceBlock_.isShadow() && this.sourceBlock_.getParent()) {
        primaryColor = this.sourceBlock_.getParent().getColour();
      } else {
        primaryColor = this.sourceBlock_.getColour();
      }

      // Active hover color
      Blockly.DropDownDiv.DIV_.style.backgroundColor = removeAlpha(primaryColor);
      if (isColoredTextMode()) {
        Blockly.DropDownDiv.getContentDiv().style.setProperty("--editorTheme3-hoveredItem", fieldBackground(this));
      } else {
        Blockly.DropDownDiv.getContentDiv().style.removeProperty("--editorTheme3-hoveredItem");
      }
    }
  };

  const oldFieldVerticalSeparatorInit = Blockly.FieldVerticalSeparator.prototype.init;
  Blockly.FieldVerticalSeparator.prototype.init = function () {
    oldFieldVerticalSeparatorInit.call(this);

    // Fix vertical line between extension icon and block label
    if (!addon.self.disabled && (isColoredTextMode() || textMode() === "black")) {
      this.lineElement_.setAttribute("stroke", this.sourceBlock_.getColourTertiary());
    }
  };

  const apply = () => {
    const blockColors = JSON.parse(JSON.stringify(defaultBlockColors));

    for (const category of categories) {
      const primary = addon.settings.get(category.settingId);
      blockColors[category.colorId] = {
        primary: primaryColor(primary),
        secondary: secondaryColor(primary),
        tertiary: tertiaryColor(primary),
        quaternary: quaternaryColor(primary),
      };
    }
    blockColors.text = uncoloredTextColor();
    blockColors.textField = addon.settings.get("input-color");
    blockColors.textFieldText = textFieldText();
    if (textMode() === "colorOnWhite") blockColors.fieldShadow = "rgba(0, 0, 0, 0.15)";

    const extensions = {
      music: {
        blockIconURI: addon.self.getResource(`${iconPath()}/extensions/music.svg`)
      },
      pen: {
        blockIconURI: addon.self.getResource(`${iconPath()}/extensions/pen.svg`)
      },
      text2speech: {
        blockIconURI: addon.self.getResource(`${iconPath()}/extensions/text2speech.svg`)
      },
      translate: {
        blockIconURI: addon.self.getResource(`${iconPath()}/extensions/translate.${useBlackIcons() ? 'svg' : 'png'}`)
      },
      videoSensing: {
        blockIconURI: addon.self.getResource(`${iconPath()}/extensions/videoSensing.svg`)
      }
    };

    BLOCKS_MAP[BLOCKS_CUSTOM] = {
      blocksMediaFolder: 'blocks-media/default',
      colors: blockColors,
      extensions: extensions,
      customExtensionColors: {
        primary: primaryColor,
        secondary: secondaryColor,
        tertiary: tertiaryColor,
        quaternary: quaternaryColor,
        categoryIconBackground,
        categoryIconBorder
      },
      useForStage: false
    };

    const newTheme = addon.tab.redux.state.scratchGui.theme.theme.set('blocks', BLOCKS_CUSTOM);
    addon.tab.redux.dispatch({
      type: 'scratch-gui/theme/SET_THEME',
      theme: newTheme
    });
  };

  const disable = () => {
    const defaultTheme = detectTheme().blocks;
    const newTheme = addon.tab.redux.state.scratchGui.theme.theme.set('blocks', defaultTheme);
    addon.tab.redux.dispatch({
      type: 'scratch-gui/theme/SET_THEME',
      theme: newTheme
    });
  };

  addon.self.addEventListener("disabled", disable);
  addon.self.addEventListener("reenabled", apply);
  addon.settings.addEventListener("change", apply);
  apply();
}
