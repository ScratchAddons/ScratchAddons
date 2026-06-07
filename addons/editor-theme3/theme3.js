import { removeAlpha, multiply, brighten, alphaBlend } from "../../libraries/common/cs/text-color.esm.js";
import { updateAllBlocks } from "../../libraries/common/cs/update-all-blocks.js";
import { managedBySa } from "../../libraries/common/cs/setting-managed-by-sa.js";
// Module for sharing addon values and methods with recolor-custom-blocks
import { registerAddon, shareMethod } from "./module.js";

const dataUriRegex = new RegExp("^data:image/svg\\+xml;base64,([A-Za-z0-9+/=]*)$");
const uriHeader = "data:image/svg+xml;base64,";
const myBlocksCategory = {
  id: "myBlocks",
  settingId: "custom-color",
  colorId: "more",
};
const extensionsCategory = {
  id: null,
  settingId: "Pen-color",
  colorId: "pen",
};
const saCategory = {
  settingId: "sa-color",
  colorId: "sa",
};
const categories = [
  {
    id: "motion",
    settingId: "motion-color",
    colorId: "motion",
  },
  {
    id: "looks",
    settingId: "looks-color",
    colorId: "looks",
  },
  {
    id: "sound",
    settingId: "sounds-color",
    colorId: "sounds",
  },
  {
    id: "events",
    settingId: "events-color",
    colorId: "event",
  },
  {
    id: "control",
    settingId: "control-color",
    colorId: "control",
  },
  {
    id: "sensing",
    settingId: "sensing-color",
    colorId: "sensing",
  },
  {
    id: "operators",
    settingId: "operators-color",
    colorId: "operators",
  },
  {
    id: "variables",
    settingId: "data-color",
    colorId: "data",
  },
  {
    id: "lists",
    settingId: "data-lists-color",
    colorId: "data_lists",
  },
  myBlocksCategory,
  extensionsCategory,
  saCategory,
];

// From https://github.com/scratchfoundation/scratch-gui/blob/782fa44/src/lib/themes/default/index.js
const defaultColors = {
  motion: {
    primary: "#4C97FF",
    secondary: "#4280D7",
    tertiary: "#3373CC",
    quaternary: "#3373CC",
  },
  looks: {
    primary: "#9966FF",
    secondary: "#855CD6",
    tertiary: "#774DCB",
    quaternary: "#774DCB",
  },
  sounds: {
    primary: "#CF63CF",
    secondary: "#C94FC9",
    tertiary: "#BD42BD",
    quaternary: "#BD42BD",
  },
  control: {
    primary: "#FFAB19",
    secondary: "#EC9C13",
    tertiary: "#CF8B17",
    quaternary: "#CF8B17",
  },
  event: {
    primary: "#FFBF00",
    secondary: "#E6AC00",
    tertiary: "#CC9900",
    quaternary: "#CC9900",
  },
  sensing: {
    primary: "#5CB1D6",
    secondary: "#47A8D1",
    tertiary: "#2E8EB8",
    quaternary: "#2E8EB8",
  },
  pen: {
    primary: "#0fBD8C",
    secondary: "#0DA57A",
    tertiary: "#0B8E69",
    quaternary: "#0B8E69",
  },
  operators: {
    primary: "#59C059",
    secondary: "#46B946",
    tertiary: "#389438",
    quaternary: "#389438",
  },
  data: {
    primary: "#FF8C1A",
    secondary: "#FF8000",
    tertiary: "#DB6E00",
    quaternary: "#DB6E00",
  },
  data_lists: {
    primary: "#FF661A",
    secondary: "#FF5500",
    tertiary: "#E64D00",
    quaternary: "#E64D00",
  },
  more: {
    primary: "#FF6680",
    secondary: "#FF4D6A",
    tertiary: "#FF3355",
    quaternary: "#FF3355",
  },
  text: "#FFFFFF",
};

// From https://github.com/scratchfoundation/scratch-blocks/blob/2e3a31e/media/dropdown-arrow.svg
const arrowPath =
  "M6.36,7.79a1.43,1.43,0,0,1-1-.42L1.42,3.45a1.44,1.44,0,0,1,0-2c0.56-.56,9.31-0.56,9.87,0a1.44,1.44,0,0,1,0,2L7.37,7.37A1.43,1.43,0,0,1,6.36,7.79Z";
const arrowShadowPath =
  "M12.71,2.44A2.41,2.41,0,0,1,12,4.16L8.08,8.08a2.45,2.45,0,0,1-3.45,0L0.72,4.16A2.42,2.42,0,0,1,0,2.44,2.48,2.48,0,0,1,.71.71C1,0.47,1.43,0,6.36,0S11.75,0.46,12,.71A2.44,2.44,0,0,1,12.71,2.44Z";
const arrowShadowColor = "#231f20";

export default async function ({ addon, console, msg }) {
  // Register the addon to share information through the module
  registerAddon(addon, "editor-theme3");

  // Will be replaced with the current Scratch theme's colors when entering the editor
  let originalColors = defaultColors;
  let originalConstants = {};

  const textMode = () => {
    if (addon.self.disabled) {
      return originalColors.text === "#000000" ? "black" : "white";
    }
    return addon.settings.get("text");
  };
  // textMode() used by recolor-custom-blocks to determine the styling of non-category colored blocks
  shareMethod("editor-theme3", textMode, "textMode");

  const isColoredTextMode = () => textMode() === "colorOnWhite" || textMode() === "colorOnBlack";
  // isColoredTextMode() Used by recolor-custom blocks to determine the styling of recolored custom block modal buttons
  shareMethod("editor-theme3", isColoredTextMode, "isColoredTextMode");

  const primaryColor = (category) => {
    if (addon.self.disabled) return originalColors[category.colorId].primary;
    // Colored on white: can't use #ffffff because of editor-dark-mode dropdown div handling
    if (textMode() === "colorOnWhite") return "#feffff";
    if (textMode() === "colorOnBlack") return "#282828";
    return addon.settings.get(category.settingId);
  };
  const secondaryColor = (category) => {
    if (addon.self.disabled) return originalColors[category.colorId].secondary;
    if (isColoredTextMode())
      return alphaBlend(primaryColor(category), multiply(addon.settings.get(category.settingId), { a: 0.15 }));
    if (textMode() === "black") return brighten(addon.settings.get(category.settingId), { r: 0.6, g: 0.6, b: 0.6 });
    return multiply(addon.settings.get(category.settingId), { r: 0.9, g: 0.9, b: 0.9 });
  };
  const tertiaryColor = (category) => {
    if (addon.self.disabled) return originalColors[category.colorId].tertiary;
    if (isColoredTextMode()) return addon.settings.get(category.settingId);
    if (textMode() === "black") return multiply(addon.settings.get(category.settingId), { r: 0.65, g: 0.65, b: 0.65 });
    return multiply(addon.settings.get(category.settingId), { r: 0.8, g: 0.8, b: 0.8 });
  };
  const uncoloredTextColor = () => {
    return {
      white: "#ffffff",
      black: "#000000",
      colorOnWhite: "#000000",
      colorOnBlack: "#ffffff",
    }[textMode()];
  };

  const updateMonitorColors = () => {
    const allMonitors = addon.tab.redux.state.scratchGui.monitors.valueSeq();
    const visibleMonitors = allMonitors.filter((monitor) => monitor.visible);
    const monitorElements = document.querySelectorAll("[class*='monitor_monitor-container_']");
    // The order of monitors in the Redux state and in the DOM is the same
    visibleMonitors.forEach((monitor, i) => {
      const opcodePrefix = monitor.opcode.split("_")[0];
      let colorId =
        {
          sound: "sounds",
          procedures: "more",
        }[opcodePrefix] || opcodePrefix;
      if (monitor.opcode === "data_listcontents") colorId = "data_lists";
      let category = categories.find((category) => category.colorId === colorId);
      if (!category) category = extensionsCategory;
      const el = monitorElements[i];
      if (addon.settings.get("monitors") || addon.self.disabled) {
        el.style.setProperty("--sa-monitor-background", primaryColor(category));
        el.style.setProperty("--sa-monitor-text", isColoredTextMode() ? tertiaryColor(category) : uncoloredTextColor());
        // Border color for list items
        if (textMode() === "colorOnBlack") el.style.setProperty("--sa-monitor-border", "rgba(255, 255, 255, 0.15)");
        else el.style.removeProperty("--sa-monitor-border");
      } else {
        /* If the addon is enabled but the monitors setting is disabled,
           the default colors are used even if the Scratch theme is set to high contrast. */
        el.style.setProperty("--sa-monitor-background", defaultColors[category.colorId].primary);
        el.style.setProperty("--sa-monitor-text", defaultColors.text);
        el.style.removeProperty("--sa-monitor-border");
      }
    });
  };
  addon.tab.redux.initialize();
  updateMonitorColors();
  addon.tab.redux.addEventListener("statechanged", (e) => {
    if (
      [
        "scratch-gui/mode/SET_PLAYER",
        "fontsLoaded/SET_FONTS_LOADED",
        "scratch-gui/locales/SELECT_LOCALE",
        "scratch-gui/settings/SET_COLOR_MODE",
        "scratch-gui/settings/SET_THEME",
        "scratch-gui/monitors/UPDATE_MONITORS",
      ].includes(e.detail.action.type)
    ) {
      // Timeout to wait until the elements are rendered
      setTimeout(updateMonitorColors, 0);
    }
  });
  addon.settings.addEventListener("change", updateMonitorColors);
  addon.self.addEventListener("disabled", updateMonitorColors);
  addon.self.addEventListener("reenabled", updateMonitorColors);

  // Blockly is only available in the editor
  // Code that needs to work on the project page must be above this line
  const Blockly = await addon.tab.traps.getBlockly();

  const updateOriginalColors = (theme) => {
    const styles = theme.blockStyles;
    for (const [colorId, color] of Object.entries(styles)) {
      if (colorId.endsWith("_selected")) continue;
      if (!color.colourPrimary) {
        // not a block color
        originalColors[colorId] = color;
        continue;
      }
      originalColors[colorId] = {
        primary: color.colourPrimary,
        secondary: color.colourSecondary,
        tertiary: color.colourTertiary,
        quaternary: color.colourQuaternary,
      };
      if (!categories.find((category) => category.colorId === colorId)) {
        categories.push({
          id: null,
          settingId: extensionsCategory.settingId,
          colorId,
        });
      }
    }
  };
  updateOriginalColors(addon.tab.traps.getWorkspace().getTheme());
  originalColors.sa = {
    primary: "#29beb8",
    secondary: "#3aa8a4",
    tertiary: "#3aa8a4",
  };

  const FieldNumber = Blockly.registry.getClass(Blockly.registry.Type.FIELD, "field_number");
  const originalNumpadDeleteIcon = FieldNumber.NUMPAD_DELETE_ICON;

  const fieldBackground = (category) => {
    // Background color for open dropdowns and (in some textModes) Boolean inputs
    // The argument can be a block, field, or category
    if (category instanceof Blockly.Block || category instanceof Blockly.Field) {
      let block = category instanceof Blockly.Block ? category : category.sourceBlock_;
      if (block.isShadow() && block.getParent()) block = block.getParent();
      if (isColoredTextMode() || textMode() === "black") {
        let primary;
        let tertiary = block.getColourTertiary();
        // If a color is specified by recolor-custom-blocks, use that instead
        if (block.recolorCustomBlock?.isEdited) {
          primary = block.recolorCustomBlock.colourPrimary;
          tertiary = block.recolorCustomBlock.colourTertiary;
        } else if (block.isShadow() && block.getParent()) primary = block.getParent().getColour();
        else primary = block.getColour();
        if (isColoredTextMode()) return alphaBlend(primary, multiply(tertiary, { a: 0.25 }));
        else return brighten(primary, { r: 0.4, g: 0.4, b: 0.4 });
      }
      return block.getColourTertiary();
    }
    if (isColoredTextMode())
      return alphaBlend(primaryColor(category), multiply(addon.settings.get(category.settingId), { a: 0.25 }));
    if (textMode() === "black") return brighten(primaryColor(category), { r: 0.4, g: 0.4, b: 0.4 });
    return tertiaryColor(category);
  };
  const textColor = (field) => {
    if (addon.self.disabled) return originalColors.text;
    if (textMode() === "white") return "#ffffff";
    if (textMode() === "black") return "#000000";
    if (field) {
      let block = field.sourceBlock_;
      if (block.recolorCustomBlock?.isEdited) {
        // If custom-recolor-blocks sets the color, use it's tertiary color instead
        return block.recolorCustomBlock.colourTertiary;
      }
      if (block.isShadow() && block.getParent()) block = block.getParent();
      return block.getColourTertiary();
    }
    return "#000000";
  };
  const otherColor = (settingId, colorId) => {
    if (addon.self.disabled) return originalColors[colorId];
    return addon.settings.get(settingId);
  };
  const useBlackIcons = () => {
    return {
      white: false,
      black: true,
      colorOnWhite: true,
      colorOnBlack: false,
    }[textMode()];
  };
  const iconPath = () => `${addon.self.dir}/icons/${useBlackIcons() ? "black_text" : "white_text"}`;

  const makeDropdownArrow = (color) => {
    let createSvgElement;
    if (Blockly.registry) createSvgElement = Blockly.utils.dom.createSvgElement;
    else createSvgElement = Blockly.utils.createSvgElement;
    const arrow = createSvgElement("g");
    arrow.appendChild(
      createSvgElement("path", {
        d: arrowShadowPath,
        fill: arrowShadowColor,
        "fill-opacity": 0.1,
        transform: "translate(0, 1.6)",
      })
    );
    arrow.appendChild(
      createSvgElement("path", {
        d: arrowPath,
        fill: color,
        transform: "translate(0, 1.6)",
      })
    );
    return arrow;
  };

  // Allow colors with transparency
  const oldValidatedBlockStyle = Blockly.blockRendering.ConstantProvider.prototype.validatedBlockStyle_;
  Blockly.blockRendering.ConstantProvider.prototype.validatedBlockStyle_ = function (style) {
    try {
      return oldValidatedBlockStyle.call(this, style);
    } catch {
      return {
        colourPrimary: style.colourPrimary || "#000",
        colourSecondary: style.colourSecondary || "#000",
        colourTertiary: style.colourTertiary || "#000",
        colourQuaternary: style.colourQuaternary || "#000",
        hat: style.hat || "",
      };
    }
  };

  const recolorExtensionIcon = (item) => {
    if (addon.self.disabled) return;
    const oldIconUri = item.iconURI;
    if (oldIconUri) {
      const id = item.getId();
      if (!["sa-blocks", "videoSensing", "text2speech"].includes(id)) return oldIconUri;

      const match = dataUriRegex.exec(oldIconUri);
      if (match) {
        const oldSvg = atob(match[1]);
        const category = id === "sa-blocks" ? saCategory : extensionsCategory;
        const newColor = textMode() === "white" ? primaryColor(category) : tertiaryColor(category);
        if (newColor) {
          const newSvg = oldSvg.replace(/#29beb8|#229487|#0ebd8c/gi, newColor);
          const newIconUri = `data:image/svg+xml;base64,${btoa(newSvg)}`;
          item.iconURI = newIconUri;
        }
      }
    }
  };
  const ScratchContinuousCategory = Blockly.registry.getClass(
    Blockly.registry.Type.TOOLBOX_ITEM,
    Blockly.ToolboxCategory.registrationName
  );
  const oldCategoryCreateIconDom = ScratchContinuousCategory.prototype.createIconDom_;
  ScratchContinuousCategory.prototype.createIconDom_ = function () {
    // Category bubbles
    const oldIconUri = this.iconURI;
    recolorExtensionIcon(this);
    if (!oldIconUri) {
      const category = categories.find((item) => item.id === this.getId());
      if (category) {
        this.colour_ = isColoredTextMode() ? fieldBackground(category) : primaryColor(category);
        this.secondaryColour = tertiaryColor(category);
      }
    }
    const iconElement = oldCategoryCreateIconDom.call(this);
    this.iconURI = oldIconUri;
    return iconElement;
  };

  const oldThemeSetBlockStyle = Blockly.Theme.prototype.setBlockStyle;
  Blockly.Theme.prototype.setBlockStyle = function (colorId, colors) {
    // Extension blocks (color is set when extension is added)
    if (colors.colourPrimary && colors.colourPrimary.toLowerCase() === originalColors.pen.primary.toLowerCase()) {
      originalColors[colorId] = {
        primary: colors.colourPrimary,
        secondary: colors.colourSecondary,
        tertiary: colors.colourTertiary,
      };
      colors = {
        colourPrimary: primaryColor(extensionsCategory),
        colourSecondary: secondaryColor(extensionsCategory),
        colourTertiary: tertiaryColor(extensionsCategory),
        colourQuaternary: fieldBackground(extensionsCategory),
      };
      if (!categories.find((category) => category.colorId === colorId)) {
        categories.push({
          id: colorId,
          settingId: extensionsCategory.settingId,
          colorId,
        });
      }
    }
    return oldThemeSetBlockStyle.call(this, colorId, colors);
  };

  const oldPathObjectApplyColour = Blockly.zelos.PathObject.prototype.applyColour;
  Blockly.zelos.PathObject.prototype.applyColour = function (block) {
    // Boolean inputs (called when theme changes)
    oldPathObjectApplyColour.call(this, block);
    if (isColoredTextMode()) {
      for (const outline of this.outlines.values()) {
        outline.setAttribute("fill", this.style.colourSecondary);
      }
    }
  };
  const oldPathObjectSetOutlinePath = Blockly.zelos.PathObject.prototype.setOutlinePath;
  Blockly.zelos.PathObject.prototype.setOutlinePath = function (name, pathString) {
    // Boolean inputs (called when a new block is created)
    oldPathObjectSetOutlinePath.call(this, name, pathString);
    if (isColoredTextMode()) {
      this.getOutlinePath(name).setAttribute("fill", this.style.colourSecondary);
    }
  };

  const oldCreateInsertionMarker = Blockly.InsertionMarkerPreviewer.prototype.createInsertionMarker;
  Blockly.InsertionMarkerPreviewer.prototype.createInsertionMarker = function (originalBlock) {
    const markerBlock = oldCreateInsertionMarker.call(this, originalBlock);
    if (!addon.self.disabled) {
      const styleColour = isColoredTextMode() ? originalBlock.getColourTertiary() : originalBlock.getColour();
      const fillStyle = addon.settings.get("fillStyle");
      const strokeStyle = addon.settings.get("strokeStyle");

      const svgPath = markerBlock.pathObject.svgPath;
      svgPath.style.fill = {
        none: "transparent",
        gray: "",
        colored: styleColour,
      }[fillStyle];
      svgPath.style.stroke = {
        none: "",
        gray: "var(--editorDarkMode-workspace-insertionMarker, rgb(0, 0, 0))",
        colored: styleColour,
      }[strokeStyle];
    }
    return markerBlock;
  };

  const oldBlockShowContextMenu = Blockly.BlockSvg.prototype.showContextMenu;
  Blockly.BlockSvg.prototype.showContextMenu = function (e) {
    // editor-colored-context-menus compatibility
    const widgetDiv = Blockly.WidgetDiv.getDiv();
    widgetDiv.style.setProperty("--editorTheme3-hoveredItem", fieldBackground(this));
    return oldBlockShowContextMenu.call(this, e);
  };

  const oldFieldGetConstants = Blockly.Field.prototype.getConstants;
  Blockly.Field.prototype.getConstants = function () {
    const constants = oldFieldGetConstants.call(this);
    for (const [name, settingId] of [["FIELD_BORDER_RECT_COLOUR", "input-color"]]) {
      if (!Object.prototype.hasOwnProperty.call(originalConstants, name)) originalConstants[name] = constants[name];
      if (addon.self.disabled) constants[name] = originalConstants[name];
      else constants[name] = addon.settings.get(settingId);
    }
    return constants;
  };

  const oldFieldLabelApplyColour = Blockly.FieldLabel.prototype.applyColour;
  Blockly.FieldLabel.prototype.applyColour = function () {
    // Labels
    oldFieldLabelApplyColour.call(this);
    if (this.textElement_) this.textElement_.style.fill = textColor(this);
  };

  const oldFieldNumberShowNumPad = FieldNumber.prototype.showNumPad_;
  FieldNumber.prototype.showNumPad_ = function () {
    // Number pad
    oldFieldNumberShowNumPad.call(this);
    Blockly.DropDownDiv.setColour(
      this.sourceBlock_.getParent().getColour(),
      this.sourceBlock_.getParent().getColourTertiary()
    );
  };

  const oldFieldImageSetValue = Blockly.FieldImage.prototype.setValue;
  Blockly.FieldImage.prototype.setValue = function (src) {
    // Icons
    if (this.saOriginalSrc) src = this.saOriginalSrc;
    else this.saOriginalSrc = src;
    if ((src.startsWith("data:") || src.includes("static/assets")) && this.sourceBlock_) {
      // Extension icon
      const iconsToReplace = ["music", "pen", "text2speech", "translate", "videoSensing", "faceSensing"];
      const extensionId = this.sourceBlock_.type.split("_")[0];
      if (iconsToReplace.includes(extensionId)) {
        if (extensionId === "translate" && !useBlackIcons()) src = `${iconPath()}/extensions/translate.png`;
        else src = `${iconPath()}/extensions/${extensionId}.svg`;
      }
    } else {
      const iconsToReplace = ["repeat.svg", "rotate-left.svg", "rotate-right.svg"];
      const iconName = src.split("/")[src.split("/").length - 1];
      if (iconsToReplace.includes(iconName)) {
        src = `${iconPath()}/${iconName}`;
      }
    }
    return oldFieldImageSetValue.call(this, src);
  };

  const oldFieldImageApplyColour = Blockly.FieldImage.prototype.applyColour;
  Blockly.FieldImage.prototype.applyColour = function () {
    // Update icon
    oldFieldImageApplyColour.call(this);
    this.setValue(this.getValue()); // setValue() is overridden above
  };

  const oldFieldDropdownApplyColour = Blockly.FieldDropdown.prototype.applyColour;
  Blockly.FieldDropdown.prototype.applyColour = function () {
    // Dropdowns
    oldFieldDropdownApplyColour.call(this);
    if (this.textElement_) this.textElement_.style.setProperty("fill", textColor(this), "important");
    if (this.svgArrow) {
      this.svgArrow.remove();
      this.svgArrow = makeDropdownArrow(textColor(this));
      this.fieldGroup_.appendChild(this.svgArrow);
      // Reposition arrow
      this.renderSelectedText();
    }
  };

  const ScratchFieldDropdown = Blockly.registry.getClass(Blockly.registry.Type.FIELD, "field_dropdown");

  // Force all instances of Blockly.FieldDropdown to behave like ScratchFieldDropdown
  // This fixes some dropdowns using tertiary instead of quaternary color when open
  const oldBlocklyFieldDropdownShowEditor = Blockly.FieldDropdown.prototype.showEditor_;
  Blockly.FieldDropdown.prototype.showEditor_ = function (e) {
    if (this instanceof ScratchFieldDropdown || this.saPreventInfiniteRecursion) {
      oldBlocklyFieldDropdownShowEditor.call(this, e);
      return;
    }
    this.saPreventInfiniteRecursion = true;
    ScratchFieldDropdown.prototype.showEditor_.call(this, e);
    delete this.saPreventInfiniteRecursion;
  };
  const oldBlocklyFieldDropdownDispose = Blockly.FieldDropdown.prototype.dropdownDispose_;
  Blockly.FieldDropdown.prototype.dropdownDispose_ = function (e) {
    if (this instanceof ScratchFieldDropdown || this.saPreventInfiniteRecursion) {
      oldBlocklyFieldDropdownDispose.call(this, e);
      return;
    }
    this.saPreventInfiniteRecursion = true;
    ScratchFieldDropdown.prototype.dropdownDispose_.call(this, e);
    delete this.saPreventInfiniteRecursion;
  };

  const oldFieldDropdownShowEditor = ScratchFieldDropdown.prototype.showEditor_;
  ScratchFieldDropdown.prototype.showEditor_ = function () {
    oldFieldDropdownShowEditor.call(this);
    if (isColoredTextMode()) {
      Blockly.DropDownDiv.getContentDiv().style.setProperty("--editorTheme3-hoveredItem", fieldBackground(this));
    } else {
      Blockly.DropDownDiv.getContentDiv().style.removeProperty("--editorTheme3-hoveredItem");
    }
  };

  const FieldNote = Blockly.registry.getClass(Blockly.registry.Type.FIELD, "field_note");
  const oldFieldNoteAddOctaveButton = FieldNote.prototype.addOctaveButton_;
  FieldNote.prototype.addOctaveButton_ = function (...args) {
    // Octave buttons in "play note" dropdown
    const group = oldFieldNoteAddOctaveButton.call(this, ...args);
    group
      .querySelector("image")
      .setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", `${iconPath()}/arrow_button.svg`);
    return group;
  };

  // Matrix inputs
  const FieldMatrix = Blockly.registry.getClass(Blockly.registry.Type.FIELD, "field_matrix");
  const oldFieldMatrixApplyColour = FieldMatrix.prototype.applyColour;
  FieldMatrix.prototype.applyColour = function () {
    oldFieldMatrixApplyColour.call(this);
    if (this.getValue()) this.updateMatrix_();
    if (!this.arrow_) return;
    const arrowTransform = this.arrow_.getAttribute("transform");
    this.arrow_.remove();
    this.arrow_ = makeDropdownArrow(textColor(this));
    this.arrow_.setAttribute("transform", arrowTransform);
    this.arrow_.style.cursor = "default";
    this.fieldGroup_.appendChild(this.arrow_);
  };

  const FieldVerticalSeparator = Blockly.registry.getClass(Blockly.registry.Type.FIELD, "field_vertical_separator");
  const oldFieldVerticalSeparatorApplyColour = FieldVerticalSeparator.prototype.applyColour;
  FieldVerticalSeparator.prototype.applyColour = function () {
    // Vertical line between extension icon and block label
    oldFieldVerticalSeparatorApplyColour.call(this);
    if (this.lineElement) {
      if (isColoredTextMode() || textMode() === "black")
        this.lineElement.setAttribute("stroke", this.sourceBlock_.getColourTertiary());
      else this.lineElement.setAttribute("stroke", this.sourceBlock_.getColourSecondary());
    }
  };

  const updateColors = (workspace) => {
    for (const category of categories) {
      // CSS variables are used for compatibility with other addons
      const prefix = `--editorTheme3-${category.colorId}`;
      for (const [name, value] of Object.entries({
        primary: primaryColor(category),
        secondary: secondaryColor(category),
        tertiary: tertiaryColor(category),
        field: fieldBackground(category),
      })) {
        document.documentElement.style.setProperty(`${prefix}-${name}`, value);
      }
    }
    // update theme
    if (!workspace) workspace = addon.tab.traps.getWorkspace();
    workspace.setTheme(
      Blockly.Theme.defineTheme(
        "default", // Scratch's CSS expects the name to be "default" or "high-contrast"
        {
          blockStyles: Object.fromEntries(
            categories.map((category) => [
              category.colorId,
              {
                colourPrimary: primaryColor(category),
                colourSecondary: secondaryColor(category),
                colourTertiary: tertiaryColor(category),
                colourQuaternary: fieldBackground(category),
              },
            ])
          ),
        }
      )
    );
    workspace.refreshTheme();
    // used by Blockly and editor-colored-context-menus
    document.body.style.setProperty("--colour-text", uncoloredTextColor());
    addon.tab.setCustomBlockColor({
      color: primaryColor(saCategory),
      secondaryColor: secondaryColor(saCategory),
      tertiaryColor: tertiaryColor(saCategory),
    });

    const safeTextColor = encodeURIComponent(uncoloredTextColor());
    FieldNumber.NUMPAD_DELETE_ICON = originalNumpadDeleteIcon.replace("white", safeTextColor);

    updateAllBlocks(addon.tab, {
      updateMainWorkspace: false,
      updateFlyout: false,
      updateCategories: true,
    });
  };

  const updateAllWorkspaces = () => {
    for (const workspace of Blockly.common.getAllWorkspaces()) {
      updateColors(workspace);
    }
  };
  updateAllWorkspaces();
  addon.settings.addEventListener("change", updateAllWorkspaces);
  addon.self.addEventListener("disabled", updateAllWorkspaces);
  addon.self.addEventListener("reenabled", updateAllWorkspaces);

  // ThemeManager.subscribeWorkspace() is called when a new workspace is created
  const oldThemeManagerSubscribeWorkspace = Blockly.ThemeManager.prototype.subscribeWorkspace;
  Blockly.ThemeManager.prototype.subscribeWorkspace = function (workspace) {
    oldThemeManagerSubscribeWorkspace.call(this, workspace);
    setTimeout(() => {
      /* We need to update originalColors if the user toggles the high contrast theme
         while the addon is dynamically disabled. We shouldn't update them if the addon is
         enabled because that would save the colors modified by the addon to originalColors. */
      if (addon.self.disabled) {
        updateOriginalColors(workspace.getTheme());
      }
      updateColors(workspace);
    }, 0);
  };

  (async () => {
    // Custom colors for "Add an input/label" block icons in the "Make a block" popup menu, by pumpkinhasapatch
    while (true) {
      // Wait until "Make a block" popup is opened and icon elements are created
      const iconElement = await addon.tab.waitForElement("[class*=custom-procedures_option-icon_]", {
        markAsSeen: true,
        reduxEvents: ["scratch-gui/custom-procedures/ACTIVATE_CUSTOM_PROCEDURES"],
        reduxCondition: (state) =>
          state.scratchGui.editorTab.activeTabIndex === 0 && !state.scratchGui.mode.isPlayerOnly,
      });
      // Get img.src, remove data:image... header, then atob() decodes base64 to get the actual <svg> tags.
      let svg = atob(iconElement.src.replace(uriHeader, ""));

      // Find and replace the default color codes in the svg with our custom ones
      // Placeholder values are used to prevent hex codes replacing each other (see PR #7545 changes)
      svg = svg
        .replace("#ff6680", "%primary%") // Primary block color
        .replace("#ff4d6a", "%inner%") // Inside empty boolean/reporter input slots
        .replace("#f35", "%outline%") // Border around edges of block
        .replace("#fff", "%labeltext%") // Text color for "Add a label" icon
        .replace("%primary%", primaryColor(myBlocksCategory))
        .replace("%inner%", isColoredTextMode() ? fieldBackground(myBlocksCategory) : tertiaryColor(myBlocksCategory))
        .replace("%outline%", tertiaryColor(myBlocksCategory))
        .replace("%labeltext%", isColoredTextMode() ? tertiaryColor(myBlocksCategory) : uncoloredTextColor());

      iconElement.src = uriHeader + btoa(svg); // Re-encode image to base64 and replace img.src
    }
  })();

  while (true) {
    const colorModeSubmenu = await addon.tab.waitForElement(
      "[class*=menu-bar_menu-bar-menu_] > ul > li:last-child [class*=menu_menu_]",
      {
        markAsSeen: true,
        reduxCondition: (state) => !state.scratchGui.mode.isPlayerOnly,
      }
    );
    colorModeSubmenu.classList.add("sa-colormode-submenu");
    managedBySa(addon, colorModeSubmenu);
  }
}
