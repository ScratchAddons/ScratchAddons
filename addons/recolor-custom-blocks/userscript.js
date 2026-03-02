import { updateAllBlocks } from "../../libraries/common/cs/update-all-blocks.js";
import { brighten, multiply, parseHex, alphaBlend } from "../../libraries/common/cs/text-color.esm.js";
import { getAddonValue, callSharedMethod } from "../editor-theme3/module.js";

const uriHeader = "data:image/svg+xml;base64,";

const prefixColors = {
  motion: "motion",
  looks: "looks",
  sound: "sounds",
  events: "event",
  control: "control",
  sensing: "sensing",
  operators: "operators",
  variables: "data",
  lists: "data_lists",
  more: "more",
  pen: "pen",
};

const categoryColors = [
  "motion",
  "looks",
  "sound",
  "events",
  "control",
  "sensing",
  "operators",
  "variables",
  "lists",
  "more",
  "pen",
];

const isHexColor = (hexString) => {
  if (!hexString.startsWith("#")) {
    return false;
  }
  const hex = hexString.substring(1);
  return typeof hex === "string" && hex.length === 6 && !isNaN(Number("0x" + hex));
};
const hexToRGB = (hexString) => {
  const rgb = parseHex(hexString);
  return rgb.a ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${rgb.a})` : `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
};
const hexRemoveAlpha = (hexString) => hexString.slice(0, 7);

export default async function ({ addon, console }) {
  const Blockly = await addon.tab.traps.getBlockly();
  // This is a dumb way of displaying scratch's color field dropdown menu without needing a block
  // to attach it to. This is kept in its own class to keep all the "hack-y-ness" to one area
  class ColorPicker extends Blockly.FieldColourSlider {
    constructor(workspace) {
      super("#ffffff"); // Needs color to be initialized
      this.category = null;
      this.workspace = workspace;
      this.boundingRect = null;
      this.themeColors = null;
      this.width = null;
      this.height = null;
      this.valueCallback = null;
      this.sourceBlock_ = this;
      this.parentBlock_ = this;
    }
    // These methods are called by Blockly when creating the menu.
    // Each of these are set from the showPopup() method
    getCategory() {
      if (!this.category) throw new Error("No category provided");
      return this.category;
    }
    getSvgRoot() {
      // Lazy way to not need to make actually Blockly.BlockSvg's for the FieldColourSlider
      // to interact with. As long as our object has the correct named properties/method,
      // it'll not throw an error
      return this;
    }
    getBoundingClientRect() {
      // Used to determine where to place the menu
      if (!this.boundingRect) throw new Error("Cannot invoke without bounding rect");
      return this.boundingRect;
    }
    // Used by the editor-colored-context-menu addon to set colors
    getColour() {
      if (!this.themeColors) throw new Error("Cannot invoke without themeColors");
      return this.themeColors.colourPrimary;
    }
    getColourSecondary() {
      if (!this.themeColors) throw new Error("Cannot invoke without themeColors");
      return this.themeColors.colourSecondary;
    }
    getColourTertiary() {
      if (!this.themeColors) throw new Error("Cannot invoke without themeColors");
      return this.themeColors.colourTertiary;
    }
    getColourQuaternary() {
      if (!this.themeColors) throw new Error("Cannot invoke without themeColors");
      return this.themeColors.colourQuaternary;
    }
    // Old Blockly
    setColour(color) {
      this.valueCallback?.(color);
    }
    // New Blockly
    setValue(color) {
      super.setValue(color);
      this.valueCallback?.(color);
    }
    // new Blockly needs this for it's init
    getValue() {
      return this.colour_;
    }

    showPopup(colorElement, displayColor, category, themeColors, valueCallback) {
      this.themeColors = themeColors;
      this.category = category;
      this.colour_ = displayColor;
      this.valueCallback = valueCallback;
      const boundingRect = colorElement.getBoundingClientRect();
      this.boundingRect = boundingRect;
      this.width = boundingRect.width;
      this.height = boundingRect.height;
      super.showEditor_(); // display the editor
    }
    hidePopup() {
      // hide the editor
      Blockly.DropDownDiv.hideWithoutAnimation();
    }
  }

  // Best guess colors given a target block color
  const getFakeBlockColors = (block, hexString) => {
    const textMode = callSharedMethod("editor-theme3", "textMode").return;
    let primary = hexString;
    let secondary = multiply(hexString, { r: 0.9, g: 0.9, b: 0.9 });
    let tertiary = multiply(hexString, { r: 0.8, g: 0.8, b: 0.8 });
    let quaternary = multiply(hexString, { r: 0.8, g: 0.8, b: 0.8 });
    // Based on editor-theme3 color values
    if (getAddonValue("editor-theme3", "disabled") === false) {
      switch (textMode) {
        case "colorOnWhite":
          primary = "#feffff";
          secondary = alphaBlend(primary, multiply(hexString, { a: 0.15 }));
          tertiary = hexString;
          quaternary = hexString;
          break;
        case "colorOnBlack":
          primary = "#282828";
          secondary = alphaBlend(primary, multiply(hexString, { a: 0.15 }));
          tertiary = hexString;
          quaternary = hexString;
          break;
        case "black":
          secondary = brighten(hexString, { r: 0.6, g: 0.6, b: 0.6 });
          tertiary = multiply(hexString, { r: 0.65, g: 0.65, b: 0.65 });
          quaternary = multiply(hexString, { r: 0.65, g: 0.65, b: 0.65 });
          break;
        default:
        // white settings
      }
    }
    // Blockly doesn't like transparency
    return {
      colourPrimary: hexRemoveAlpha(primary),
      colourSecondary: hexRemoveAlpha(secondary),
      colourTertiary: hexRemoveAlpha(tertiary),
      colourQuaternary: hexRemoveAlpha(quaternary),
    };
  };
  // Standardize colour names between Blockly versions
  const getBlocklyColors = (prefix) => {
    const colorName = prefixColors[prefix];
    if (!colorName) return null;
    if (Blockly.registry) {
      const workspace = addon.tab.traps.getWorkspace();
      return workspace.getTheme().blockStyles[colorName];
    } else {
      const colors = Blockly.Colours[colorName];
      return {
        colourPrimary: colors.primary,
        colourSecondary: colors.secondary,
        colourTertiary: colors.tertiary,
        colourQuaternary: colors.quaternary,
      };
    }
  };

  const blockHasColor = (block, colors) => {
    const customColor = block.recolorCustomBlock;
    if (!customColor) return false;
    return (
      customColor.colourPrimary === colors.colourPrimary &&
      customColor.colourSecondary === colors.colourSecondary &&
      customColor.colourTertiary === colors.colourTertiary &&
      customColor.colourQuaternary === colors.colourQuaternary
    );
  };

  const setProcedureButtonColor = (iconElement, colors) => {
    let svg = atob(iconElement.src.replace(uriHeader, ""));

    // To change the menu item colors, we are inserting our own css after scratch's in the style tag
    // We want to avoid adding unneeded styling, so we keep our changes after the "rcb edit" comment
    // This allows us to remove old changes, and not be negatively effected by theme3 recoloring them
    const editedComment = "/*rcb edit*/";
    const endStyleIndex = svg.indexOf("</style>");
    const editedCommentIndex = svg.indexOf(editedComment);
    let textColor = "#ffffff";
    if (
      getAddonValue("editor-theme3", "disabled") !== true &&
      callSharedMethod("editor-theme3", "isColoredTextMode").return
    ) {
      textColor = colors.colourTertiary;
    }

    // converting to rgb since theme3 replaces string occurrences of certain hex values
    const appendedStyles = `
      ${editedComment}
      .cls-3 {
        fill: ${hexToRGB(colors.colourPrimary)};
      }
      .cls-3, .cls-4 {
        stroke: ${hexToRGB(colors.colourTertiary)};
      }
      .cls-4 {
        fill: ${hexToRGB(colors.colourSecondary)};
      }
      text.cls-4 {
        fill: ${hexToRGB(textColor)};
        stroke: unset;
      }
    `;
    if (editedCommentIndex === -1) {
      // If we haven't made edits before, insert those
      svg = svg.substring(0, endStyleIndex) + appendedStyles + svg.substring(endStyleIndex);
    } else {
      // Elsewise replace our previous edits as well
      svg = svg.substring(0, editedCommentIndex) + appendedStyles + svg.substring(endStyleIndex);
    }
    iconElement.src = uriHeader + btoa(svg);
  };

  const setCustomProcedureOptionsColor = (colors) => {
    const optionsRowElement = document.querySelectorAll("[class^=custom-procedures_options-row_]")?.[0];
    if (optionsRowElement) {
      const imgElements = optionsRowElement.getElementsByTagName("img");
      for (const element of imgElements) {
        setProcedureButtonColor(element, colors);
      }
    }
  };
  // Get the html input element used to get text input on focused fields
  const getFieldInput = (block) => {
    for (const child of block.getChildren()) {
      const htmlInput = block?.inputList?.[0]?.fieldRow?.[0]?.htmlInput_;
      if (htmlInput) return htmlInput;
    }
    return null;
  };

  const setDeclarationColor = (block, colors, prefix) => {
    const currentColorElement = getColorButton(block.colorMenu, prefix);
    setActiveColorButton(currentColorElement, prefix, colors); // Update modal color buttons
    setCustomProcedureOptionsColor(colors); // Update modal field buttons
    if (Blockly.registry) {
      // Wait a frame or the color gets reset
      setTimeout(() => {
        // In new Blockly, the text input ring color is set by the block category, instead of the colors
        // so we need to manually recolor it.
        const fieldInput = getFieldInput(block);
        if (fieldInput) fieldInput.style.border = "0.9px solid " + colors.colourPrimary;
      }, 0);
    } else {
      // In old Blockly, the background of fields in prototype_declaration aren't colored by the block colors
      // As theme3 manually edits this color, we have it save the method which determines it's custom color,
      // so we can manually call it when we recolor the block
      for (const input of block.inputList) {
        const declarationFieldBackground = input.fieldRow?.[0]?.box_;
        if (declarationFieldBackground) {
          // Try to call editor-theme3's box coloring method on the box
          // If that doesn't exist or the addon's disabled, use our coloring
          if (!callSharedMethod("editor-theme3", "updateBox_", declarationFieldBackground).exists) {
            declarationFieldBackground.setAttribute("fill", colors.colourTertiary);
          }
        }
      }
    }
  };

  const setBlockColor = (block, colors, isEdited, prefix) => {
    if (blockHasColor(block, colors)) return; // Don't do repeated colorings
    if (!block.recolorCustomBlock) block.recolorCustomBlock = {};

    // We're storing our custom colors on a separate part of the block object
    // This is used by Blockly's applyColour / updateColour methods later
    block.recolorCustomBlock.colourPrimary = colors.colourPrimary;
    block.recolorCustomBlock.colourSecondary = colors.colourSecondary;
    block.recolorCustomBlock.colourTertiary = colors.colourTertiary;
    block.recolorCustomBlock.colourQuaternary = colors.colourQuaternary;
    block.recolorCustomBlock.isEdited = isEdited;
    block.recolorCustomBlock.prefix = prefix;
    // Some of procedures_declaration's colorings aren't caught by standard methods
    if (block.type === "procedures_declaration") setDeclarationColor(block, colors, prefix);

    if (Blockly.registry) {
      // In new Blockly, selected blocks have an additional layer called svgPathSelected, which is a copy of svgPath
      // svgPathSelected is not currently not colored from the block's colors, and needs to be manually updated
      const pathSelected = block.pathObject?.svgPathSelected;
      if (pathSelected) {
        // If another addon wants to change the coloring, it needs to be done manually here
        pathSelected.setAttribute("fill", colors.colourPrimary);
        pathSelected.setAttribute("stroke", colors.colourTertiary);
      }
      // Update the block's coloring
      block.applyColour();
      // Children block's stroke color is not updated by the parent's update
      for (const child of block.getChildren()) {
        child.applyColour();
      }
    } else {
      // Update the block's coloring
      block.updateColour(this);
      const isProceduresPrototype = block.type === "procedures_prototype";
      for (const child of block.getChildren()) {
        // In old Blockly, procedures_prototype's child's stroke color is set from the parent's color
        // so we have to manually change it after updating the parent's color
        isProceduresPrototype && (child.colourTertiary_ = Blockly.Colours[child.getCategory() ?? "more"].tertiary);
        // One more updateColour to be safe
        child.updateColour();
      }
    }
  };

  const updateBlockColors = (block) => {
    const blockText = block.procCode_ ?? ""; // Sometimes procCode_ hasn't been set yet
    const prefixEndingIndex = blockText.indexOf(":");
    if (prefixEndingIndex > 0) {
      // We have a prefix ending with a colon
      const prefix = blockText.substring(0, prefixEndingIndex);
      const blocklyColors = getBlocklyColors(prefix);
      if (blocklyColors) {
        // If it's a valid Blockly color, color it
        setBlockColor(block, blocklyColors, true, prefix);
        return;
      }
      const fakeColors = isHexColor(prefix) ? getFakeBlockColors(block, prefix) : false;
      if (fakeColors) {
        // If instead it's a valid hex color, create colors and color the block
        setBlockColor(block, fakeColors, true, prefix);
        return;
      }
    }
    // Otherwise, the colors need to be unset, if the block has been edited
    if (block.recolorCustomBlock?.isEdited) {
      setBlockColor(block, getBlocklyColors("more"), false, "more");
    }
  };

  const setNewPrefix = (block, prefix) => {
    const recolorCustomBlock = block.recolorCustomBlock;
    if (recolorCustomBlock?.isEdited) {
      // remove the old prefix
      block.procCode_ = block.procCode_.slice(recolorCustomBlock.prefix.length + 1);
    }
    if (prefix !== "more") {
      // and add the new one
      block.procCode_ = prefix + ":" + block.procCode_;
    } else if (block.procCode_.length === 0) {
      block.procCode_ = ":"; // If the procCode is empty, we lose the text input
    }
    block.updateDisplay_(); // Make procCode changes display, doesn't update color
    updateBlockColors(block); // Update color
  };

  const createColorButton = (colors) => {
    const colorButton = document.createElement("button");
    colorButton.classList.add("sa-rcb-colorButton");
    colorButton.style.backgroundColor = colors.colourPrimary;
    colorButton.style.borderColor = colors.colourTertiary;

    const checkmarkSvg = Object.assign(document.createElement("img"), {
      className: "sa-rcb-colorButtonCheck",
      src: addon.self.dir + "/assets/checkmark.svg",
      draggable: false,
    });
    colorButton.appendChild(checkmarkSvg);
    return colorButton;
  };

  const getColorButton = (colorMenu, prefix) => {
    for (const childNode of colorMenu.childNodes) {
      if (childNode["saRcbColorId"] === prefix) {
        return childNode;
      }
    }
    return colorMenu.lastChild; // Color picker button
  };

  const setActiveColorButton = (activeButton, prefix, colors) => {
    if (activeButton.classList.contains("active")) return;
    activeButton.parentNode.childNodes.forEach((childNode) => {
      childNode.firstChild.classList.remove("active");
    });
    activeButton.firstChild.classList.add("active");
    if (activeButton.currentColor) {
      activeButton.currentColor = prefix;
      activeButton.style.backgroundColor = colors.colourPrimary;
    }
  };

  const addColorMenu = (block) => {
    const proceduresBody = document.querySelectorAll("[class^=custom-procedures_body_]")?.[0];
    const optionsRow = proceduresBody.querySelectorAll("[class^=custom-procedures_options-row_]")?.[0];

    const proceduresColorRow = document.createElement("div");
    proceduresColorRow.classList.add("sa-rcb-custom-procedures_colors-row");
    proceduresBody.insertBefore(proceduresColorRow, optionsRow.nextSibling);

    for (const category of categoryColors) {
      const categoryIcon = createColorButton(getBlocklyColors(category));
      categoryIcon.addEventListener("click", () => {
        setNewPrefix(block, category);
        setActiveColorButton(categoryIcon);
      });
      if (category === "more") {
        categoryIcon.firstChild.classList.add("active");
      }
      categoryIcon["saRcbColorId"] = category;
      proceduresColorRow.appendChild(categoryIcon);
    }

    const colorPicker = new ColorPicker(Blockly.getMainWorkspace());
    const randomColor = "#" + Math.random().toString(16).slice(-6);
    const RandomBlockColors = getFakeBlockColors(block, randomColor);
    const pickerIcon = createColorButton(RandomBlockColors);
    pickerIcon.classList.add("sa-rcb-colorPicker");
    pickerIcon.currentColor = randomColor;
    pickerIcon.style.borderColor = "";

    pickerIcon.addEventListener("click", (e) => {
      e.stopPropagation(); // stops click from triggering the closePopup listener
      const currentColor = pickerIcon.currentColor;
      const blockColors = block.recolorCustomBlock ?? getFakeBlockColors(block, currentColor);
      setActiveColorButton(pickerIcon, currentColor, blockColors);
      const category = "more";
      colorPicker.showPopup(pickerIcon, currentColor, category, blockColors, (newColor) => {
        const newFakeColors = getFakeBlockColors(block, newColor);
        pickerIcon.currentColor = newColor;
        pickerIcon.style.backgroundColor = newFakeColors.colourPrimary;
        setNewPrefix(block, newColor);
      });
    });
    proceduresColorRow.appendChild(pickerIcon);
    block.colorMenu = proceduresColorRow;

    proceduresBody.addEventListener("click", (e) => {
      if (!e.target?.currentColor) {
        // Anything besides custom color button
        colorPicker.hidePopup();
      }
    });
  };
  // We use this to catch when procedures_declaration is rendered so we can modify
  // procedure_declaration's Blockly instance, and associated ui
  const oldBlockInitSvg = Blockly.BlockSvg.prototype.initSvg;
  Blockly.BlockSvg.prototype.initSvg = function (...args) {
    const initSvgResult = oldBlockInitSvg.call(this, ...args);
    if (this.type === "procedures_declaration" && !this.recolorCustomBlockInjected && !this.workspace.toolbox_) {
      addColorMenu(this);
      shimOnChangeFn(this);
      updateBlockColors(this);
    }
    return initSvgResult;
  };

  // Catch block updates to recolor as needed
  const shimOnChangeFn = (block) => {
    // If we've already injected this, don't do it again
    if (block.recolorCustomBlockInjected) return;
    block.recolorCustomBlockInjected = true;
    let oldOnChangeFn = block.onChangeFn;
    block.onChangeFn = function (...args) {
      oldOnChangeFn.call(this, ...args);
      if (!addon.self.disabled) {
        updateBlockColors(this);
      }
    };
  };

  // This is where the colors saved to block.recolorCustomBlock are used to recolor the block
  if (Blockly.registry) {
    const oldApplyColour = Blockly.BlockSvg.prototype.applyColour;
    Blockly.BlockSvg.prototype.applyColour = function (...args) {
      if (!this.isInsertionMarker() && this.getStyleName() === "more") {
        const shouldModifyBlock = this.procCode_ && this.recolorCustomBlock;
        // If the block has a procCode and has been set to be recolored, recolor it
        if (shouldModifyBlock) {
          const color = this.recolorCustomBlock;
          this.style = {
            ...this.style,
            colourPrimary: color.colourPrimary,
            colourSecondary: color.colourSecondary,
            colourTertiary: color.colourTertiary,
            colourQuaternary: color.colourQuaternary,
          };
          this.pathObject.setStyle(this.style);
          // In new Blockly, procedures_prototype's children set their stroke color by the parent's tertiary color
          // We need to revert this after calling applyColour
          if (this.type === "procedures_prototype") {
            const applyColorResult = oldApplyColour.call(this, ...args);
            this.style.colourTertiary = color.colourTertiary;
            this.pathObject.svgPath.setAttribute("stroke", color.colourTertiary);
            return applyColorResult;
          }
        }
      }
      return oldApplyColour.call(this, ...args);
    };
  } else {
    const oldUpdateColour = Blockly.BlockSvg.prototype.updateColour;
    Blockly.BlockSvg.prototype.updateColour = function (...args) {
      if (!this.isInsertionMarker() && this.getCategory?.() === null) {
        const block = this.procCode_ && this.recolorCustomBlock;
        if (block) {
          const color = this.recolorCustomBlock;
          this.colour_ = color.colourPrimary;
          this.colourSecondary_ = color.colourSecondary;
          this.colourTertiary_ = color.colourTertiary;
          this.colourQuaternary_ = color.colourQuaternary;
          // In old Blockly, procedures_prototype's children set their stroke color by the parent's tertiary color
          // We need to revert this after calling applyColour
          if (this.type === "procedures_prototype") {
            const updateColorResult = oldUpdateColour.call(this, ...args);
            this.colourTertiary_ = color.colourTertiary;
            this.svgPath_.setAttribute("stroke", color.colourTertiary);
            return updateColorResult;
          }
        }
      }
      return oldUpdateColour.call(this, ...args);
    };
  }

  // Method attached to createAllInputs which optionally hides color prefixes and calls for colors to be updated
  const customCreateAllInputs = (oldCreateAllInputs) => {
    return function (...args) {
      if (addon.self.disabled) return oldCreateAllInputs.call(this, ...args);
      updateBlockColors(this);
      const isEdited = this?.recolorCustomBlock?.isEdited;
      const prefix = this?.recolorCustomBlock?.prefix;
      if (isEdited && prefix && addon.settings.get("hideColorPrefix")) {
        const originalProcCode = this.procCode_;
        this.procCode_ = this.procCode_.slice(prefix.length + 1);
        const results = oldCreateAllInputs.call(this, ...args);
        this.procCode_ = originalProcCode;
        return results;
      }
      return oldCreateAllInputs.call(this, ...args);
    };
  };
  // Pollute procedures_call's and procedures_prototype's createAllInputs_ functions
  for (const fn of ["procedures_call", "procedures_prototype"]) {
    if (Blockly.registry) {
      const oldInit = Blockly.Blocks[fn].init;
      Blockly.Blocks[fn].init = function (...args) {
        const initResult = oldInit.call(this, ...args);
        const oldCreateAllInputs = this.createAllInputs_;
        this.createAllInputs_ = customCreateAllInputs(oldCreateAllInputs);
        return initResult;
      };
    } else {
      const originalCreateAllInputs = Blockly.Blocks[fn].createAllInputs_;
      Blockly.Blocks[fn].createAllInputs_ = customCreateAllInputs(originalCreateAllInputs);
    }
  }

  const updateExistingBlocks = () => {
    updateAllBlocks(addon.tab);
    const workspace = addon.tab.traps.getWorkspace();
    const flyout = workspace && workspace.getFlyout();
    if (workspace && flyout) {
      const allBlocks = [...workspace.getAllBlocks(), ...flyout.getWorkspace().getAllBlocks()];
      for (const block of allBlocks) {
        const shouldUpdateColoring =
          block.type === "procedures_prototype" ||
          block.type === "procedures_declaration" ||
          block.type === "procedures_call";
        if (shouldUpdateColoring) updateBlockColors(block);
      }
    }
    // If the edit block modal is already open, we need to update the block's colors
    if (addon.tab.redux.state.scratchGui.customProcedures.active) {
      const declarationBlock = Blockly.getMainWorkspace()?.getTopBlocks?.()?.[0];
      if (declarationBlock?.type === "procedures_declaration") {
        updateBlockColors(this);
      }
    }
  };

  // In new Blockly toolbox.refreshTheme doesn't trigger applyColour or initSvg, so we need to apply our changes manually
  if (Blockly.registry) {
    const attachRefreshListener = (workspace) => {
      const toolbox = workspace.getToolbox();
      if (!toolbox || !toolbox.refreshTheme) return;
      const oldRefreshTheme = toolbox.refreshTheme;
      toolbox.refreshTheme = function (...args) {
        console.warn("refreshCalled called");

        setTimeout(updateExistingBlocks, 0);
        return oldRefreshTheme.call(this, ...args);
      };
    };
    const oldThemeManagerSubscribeWorkspace = Blockly.ThemeManager.prototype.subscribeWorkspace;
    Blockly.ThemeManager.prototype.subscribeWorkspace = function (workspace) {
      console.warn("subscribe called");
      setTimeout(attachRefreshListener, 0, workspace);
      return oldThemeManagerSubscribeWorkspace.call(this, workspace);
    };
    attachRefreshListener(addon.tab.traps.getWorkspace());
  }

  const enableAddon = () => {
    updateExistingBlocks();
    // If the edit block modal is already open when we enable the addon, we need to inject everything directly and update the colors
    if (addon.tab.redux.state.scratchGui.customProcedures.active) {
      // reorder-custom-inputs overrides procedures_declaration's methods, so we inject
      // our methods only when the block is rendered
      // This should always be the block in the edit block modal, but it causes a crash when its not
      const declarationBlock = Blockly.getMainWorkspace()?.getTopBlocks?.()?.[0];
      if (declarationBlock?.type === "procedures_declaration") {
        addColorMenu(declarationBlock);
        shimOnChangeFn(declarationBlock);
        updateBlockColors(declarationBlock);
      }
    }
  };

  const disableAddon = () => {
    updateAllBlocks(addon.tab);
    // If the edit block modal is already open when we disable the addon, we need to hide the color menu and reset the block color
    if (addon.tab.redux.state.scratchGui.customProcedures.active) {
      // This should always be the block in the edit block modal, but it causes a crash when it's not
      const declarationBlock = Blockly.getMainWorkspace()?.getTopBlocks?.()?.[0];
      if (declarationBlock?.type === "procedures_declaration") {
        setBlockColor(declarationBlock, getBlocklyColors("more"), false, "more");
        declarationBlock.colorMenu.style.display = "none";
      }
    }
  };

  const reenableAddon = () => {
    enableAddon();
    // If the edit block modal is open when we reenable the addon, unhide the menu and update the block
    if (addon.tab.redux.state.scratchGui.customProcedures.active) {
      // This should always be the block in the edit block modal, but it causes a crash when it's not
      const declarationBlock = Blockly.getMainWorkspace()?.getTopBlocks?.()?.[0];
      if (declarationBlock?.type === "procedures_declaration" && !declarationBlock?.recolorCustomBlockInjected) {
        updateBlockColors(declarationBlock);
        declarationBlock.colorMenu.style.display = "";
      }
    }
  };

  addon.self.addEventListener("disabled", () => disableAddon());
  addon.self.addEventListener("reenabled", () => reenableAddon());
  addon.settings.addEventListener("change", () => updateAllBlocks(addon.tab));

  enableAddon();
}
