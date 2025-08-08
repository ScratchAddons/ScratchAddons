import {updateAllBlocks} from "../../libraries/common/cs/update-all-blocks.js";

const uriHeader = "data:image/svg+xml;base64,"

export default async function ({ addon, msg, console }) {

  const Blockly = await addon.tab.traps.getBlockly();

  //
  class ColorPicker extends Blockly.FieldColourSlider {
    constructor(workspace) {
      super("#ffffff");
      this.category = null;
      this.workspace = workspace
      this.boundingRect = null;
      this.themeColors = null;
      this.width = null;
      this.height = null;
      this.valueCallback = null;
      // Dumb way to not deal with juggling sourceBlock_ and parentBlock_ definitions
      this.sourceBlock_ = this;
      this.parentBlock_ = this;
    }
    getCategory() {
      if(!this.category) {
        throw new Error("No category provided")
      }
      return this.category
    }
    getSvgRoot() {
      return this;
    }
    getBoundingClientRect() {
      if(!this.boundingRect) {
        throw new Error("Cannot invoke without bounding rect")
      }
      return this.boundingRect;
    }
    getColour() {
      if(!this.themeColors) {
        throw new Error("Cannot invoke without themeColors")
      }
      return this.themeColors.colourPrimary;
    }
    getColourSecondary() {
      if(!this.themeColors) {
        throw new Error("Cannot invoke without themeColors")
      }
      return this.themeColors.colourSecondary;
    }
    getColourTertiary() {
      if(!this.themeColors) {
        throw new Error("Cannot invoke without themeColors")
      }
      return this.themeColors.colourTertiary;
    }
    getColourQuaternary() {
      if(!this.themeColors) {
        throw new Error("Cannot invoke without themeColors")
      }
      return this.themeColors.colourQuaternary;
    }
    setColour(color) {
      this.valueCallback?.(color);
    }
    setValue(color) {
      super.setValue(color);
      this.valueCallback?.(color);
    }
    getValue(value) {
      return this.colour_;
    }

    showPopup(colorElement, displayColor, category, themeColors, valueCallback) {
      this.themeColors = themeColors
      this.category = category;
      this.colour_ = displayColor;
      this.valueCallback = valueCallback
      const boundingRect = colorElement.getBoundingClientRect()
      this.boundingRect = boundingRect;
      this.width = boundingRect.width;
      this.height = boundingRect.height
      super.showEditor_();
    }
    hidePopup() {
      Blockly.DropDownDiv.hideWithoutAnimation();
    }
  }

  const hexToRGB = (hexString) => {
    const decimal = parseInt(hexString.substring(1), 16);
    return {r: decimal >> 16, g: decimal >> 8 & 255, b: decimal & 255};
  }
  const RGBtoHex = (rgb) => {
    return "#" + ((rgb.b | rgb.g << 8 | rgb.r << 16) | 1 << 24).toString(16).slice(1);
  }
  const multiply = (hexString, {r, g, b}) => {
    const c = hexToRGB(hexString);
    const multiplied = {r: r * c.r, g: g * c.g, b: b * c.b};
    return RGBtoHex(multiplied);
  }

  const isHexColor = (hexString) => {
    if(!hexString.startsWith("#")) {
      return false;
    }
    const hex = hexString.substring(1);
    return typeof hex === 'string' && hex.length === 6 && !isNaN(Number('0x' + hex));
  }

  // Best guess colors given a target block color
  const getFakeBlockColors = (hexString) => {
    return {
      colourPrimary: hexString,
      colourSecondary: multiply(hexString, { r: 0.9, g: 0.9, b: 0.9 }),
      colourTertiary: multiply(hexString, { r: 0.8, g: 0.8, b: 0.8 }),
      colourQuaternary: multiply(hexString, { r: 0.8, g: 0.8, b: 0.8 })
    };
  }
  // Standardize colour names between Blockly
  const getBlocklyColors = (colorName) => {
    if(Blockly.registry) {
      const workspace = addon.tab.traps.getWorkspace()
      const colors = workspace.getTheme().blockStyles[colorName];
      if(colors === null || typeof colors !== "object") {
        return null;
      }
      return colors
    } else {
      const colors = Blockly.Colours[colorName];
      if(colors === null || typeof colors !== "object") {
        return null;
      }
      return {
        colourPrimary: colors.primary,
        colourSecondary: colors.secondary,
        colourTertiary: colors.tertiary,
        colourQuaternary: colors.quaternary
      }
    }
  }

  const blockHasColor = (block, colors) => {
    const customColor = block.recolorCustomBlock
    if(!customColor) {
      return false
    }
    return customColor.colourPrimary === colors.colourPrimary &&
        customColor.colourSecondary === colors.colourSecondary &&
        customColor.colourTertiary === colors.colourTertiary &&
        customColor.colourQuaternary === colors.colourQuaternary;
  }
  const setProcedureButtonColor = (iconElement, colors) => {
    let svg = atob(iconElement.src.replace(uriHeader, ""));

    // To change the menu item colors, we are inserting our own css after scratch's in the style tag
    // We want to avoid adding unneeded styling, so we keep our changes after the "rcb edit" comment
    // This allows us to remove old changes, and not be negatively effected by theme3 recoloring them
    const editedComment = "/*rcb edit*/";
    const endStyleIndex = svg.indexOf("</style>");
    const editedCommentIndex = svg.indexOf(editedComment);
    const appendedStyles = editedComment +
        ".cls-3{ fill: " + colors.colourPrimary + ";}" +
        ".cls-3, .cls-4{ stroke: " + colors.colourTertiary + ";}" +
        ".cls-4{ fill: " + colors.colourSecondary + ";}" +
        "text.cls-4{ fill:#fff; stroke:unset;}"
    if(editedCommentIndex === -1) {
      svg = svg.substring(0, endStyleIndex) + appendedStyles + svg.substring(endStyleIndex);
    } else {
      svg = svg.substring(0, editedCommentIndex) + appendedStyles + svg.substring(endStyleIndex);
    }
    iconElement.src = uriHeader + btoa(svg);
  }

  const setCustomProcedureOptionsColor = (colors) => {
    const optionsRowElement = document.querySelectorAll("[class^=custom-procedures_options-row_]")?.[0];
    if(optionsRowElement) {
      const imgElements = optionsRowElement.getElementsByTagName('img');
      for(const element of imgElements) {
        setProcedureButtonColor(element, colors);
      }
    }
  }

  const setBlockColor = (block, colors, isEdited, firstColonIndex) => {
    // If we've already set this color, don't
    if (blockHasColor(block, colors)) {
      return;
    }

    if (!block.recolorCustomBlock) {
      block.recolorCustomBlock = {};
    }
    // We're storing our custom colors on a separate part of the block object
    // This is used by Blockly's applyColour / updateColour methods later
    block.recolorCustomBlock.colourPrimary = colors.colourPrimary;
    block.recolorCustomBlock.colourSecondary = colors.colourSecondary;
    block.recolorCustomBlock.colourTertiary = colors.colourTertiary;
    block.recolorCustomBlock.colourQuaternary = colors.colourQuaternary;
    block.recolorCustomBlock.isEdited = isEdited;
    block.recolorCustomBlock.prefixEnd = firstColonIndex + 1; // Used for color menu
    block.recolorCustomBlock.prefix = block.procCode_.slice(0,firstColonIndex); // Used for color menu

    if (block.type === "procedures_declaration") {
      // Update our color button's styling to match the block
      const prefix = isEdited ? block.procCode_.slice(0,firstColonIndex) : "more";
      const currentColorElement = getColorElement(block.colorMenu, prefix);
      setColorListActive(currentColorElement, prefix, colors);

      // If there's a procedures_declaration, we're in the custom block editing screen
      // and need to recolor the buttons
      setCustomProcedureOptionsColor(colors);
      if (Blockly.registry) {
        block.getChildren().forEach((child) => {
          // Recolor the input field to match the block. By default, it's the more primary color
          const htmlInput_ = child.inputList?.[0]?.fieldRow?.[0]?.htmlInput_;
          if (htmlInput_) {
            const changeBorderColor = (htmlInput, colorPrimary) => {
              htmlInput.style.border = "0.9px solid " + colorPrimary;
            }
            // Wait until the next frame or the color gets reset
            setTimeout(changeBorderColor, 0, htmlInput_, colors.colourPrimary);
          }
        });
      } else {
        // Updating the colour does not update the background of fields in procedure_declaration
        block.inputList.forEach((input) => {
          const box_ = input.fieldRow?.[0]?.box_;
          if (box_) {
            if(box_.updateBox_) {
              box_.updateBox_();
            } else {
              box_.setAttribute('fill', colors.colourTertiary);
            }
          }
        });
      }
    }
    if (Blockly.registry) {
      // For some reason pathObject.svgPathSelected isn't updating when applyColor is called
      const pathSelected = block.pathObject?.svgPathSelected;
      if(pathSelected) {
        // This makes this harder to set from other addons, but I am stumped on how else to achieve this
        pathSelected.setAttribute("fill", colors.colourPrimary);
        pathSelected.setAttribute("stroke", colors.colourTertiary);
      }
      block.applyColour()
      block.getChildren().forEach((child) => {
        // Make sure children's stroke color isn't messed up
        child.applyColour();
      });
    } else {
      block.updateColour(this);
      const isProceduresPrototype = block.type === "procedures_prototype"
      block.getChildren().forEach((child) => {
        // Make sure children's stroke color isn't messed up
        // Also for some reason procedures_prototype's stroke color refuses to update, so we set it the hard way
        isProceduresPrototype && (child.colourTertiary_ = Blockly.Colours[child.getCategory() ?? "more"].tertiary);
        child.updateColour();
      });
    }
  }

  const handleBlock = (block) => {
    // Get type of block
    const blockStyle = Blockly.registry ? block.getStyleName() : (block.getCategory() ?? "more")
    // We only want to let procedure_ blocks through, but sometimes procedure's type and category aren't set right
    // It's easier to just do a blacklist
    if(blockStyle !== "more" || (block.type ?? "").startsWith("argument")) {
      return;
    }

    // There used to be a lot of shenanigans here, but with the applyColour / updateColour
    // methods, we don't generally deal with blocks that haven't been rendered yet
    const textContent = block.procCode_ ?? ""

    const firstColonIndex = textContent.indexOf(":");
    if(firstColonIndex !== -1 && !addon.self.disabled) {
      const colorCandidateString = textContent.substring(0,firstColonIndex);

      const colorCandidate = getBlocklyColors(colorCandidateString);
      // If we can get a valid Blockly color from colorCandidateString, set the block color
      if(colorCandidate) {
        setBlockColor(block, colorCandidate, true, firstColonIndex);
        return;
      }
      // If we can get a valid Hex color from the colorCandidateString, make fake colors
      // for it and set the block color
      if(isHexColor(colorCandidateString)) {
        const fakeColor = getFakeBlockColors(colorCandidateString);
        setBlockColor(block, fakeColor, true, firstColonIndex);

        return;
      }
    }
    // If the block doesn't qualify for a color change, check to see if it needs to be reverted
    if(block.recolorCustomBlock?.isEdited) {
      setBlockColor(block, getBlocklyColors("more"), false, 0);
    }
  }

  const updateDeclarationPrefix = (block, prefix) => {
    const recolorCustomBlock = block.recolorCustomBlock;
    if(recolorCustomBlock?.isEdited) {
      block.procCode_ = block.procCode_.slice(recolorCustomBlock?.prefixEnd);
    }
    if(prefix !== "more") {
      block.procCode_ = prefix + ":" + block.procCode_;
    }

    block.updateDisplay_();
    handleBlock(block)
  }

  const createColorButton = (colors) => {

    const colorButton = document.createElement("button");
    colorButton.classList.add("sa-rcb-colorButton")
    colorButton.style.backgroundColor = colors.colourPrimary;
    colorButton.style.borderColor = colors.colourTertiary;

    const checkmarkSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    checkmarkSvg.classList.add("sa-rcb-colorButtonCheck")
    checkmarkSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    checkmarkSvg.setAttribute("viewBox", "0 0 24 24");
    checkmarkSvg.innerHTML = `<path class="blocklyFlyoutCheckboxPath" d="M6.25 12.5L10.416666666666666 16.666666666666668L18.75 8.333333333333334"></path>`

    colorButton.appendChild(checkmarkSvg);

    return colorButton;
  }

  const getColorElement = (colorMenu, prefix) => {
    for(const childNode of colorMenu.childNodes) {
      if(childNode["saRcbColorId"] === prefix) {
        return childNode;
      }
    }
    return colorMenu.lastChild; // Color picker
  }

  const setColorListActive = (activeElement, prefix, colors) => {
    if(activeElement.classList.contains("active")) return
    activeElement.parentNode.childNodes.forEach((childNode) => {
      childNode.firstChild.classList.remove("active");
    })
    activeElement.firstChild.classList.add("active");
    if(activeElement.currentColor) {
      activeElement.currentColor = prefix;
      activeElement.style.backgroundColor = colors.colourPrimary;
    }
  }

  const addColorMenu = (block) => {
    const proceduresBody = document.querySelectorAll("[class^=custom-procedures_body_]")?.[0];
    const optionsRow = proceduresBody.querySelectorAll("[class^=custom-procedures_options-row_]")?.[0];

    const proceduresColorRow = document.createElement("div")
    proceduresColorRow.classList.add("sa-rcb-custom-procedures_colors-row");
    proceduresBody.insertBefore(proceduresColorRow, optionsRow.nextSibling);

    const colorList = ["motion", "looks", "sounds", "event", "control", "sensing", "operators", "data", "data_lists", "more", "pen"];

    colorList.forEach((category) => {
      const categoryIcon = createColorButton(getBlocklyColors(category));
      categoryIcon.addEventListener("click", (e) => {
        updateDeclarationPrefix(block, category);
        setColorListActive(categoryIcon);
      });
      if(category === "more") {
        categoryIcon.firstChild.classList.add("active")
      }
      categoryIcon["saRcbColorId"] = category;
      proceduresColorRow.appendChild(categoryIcon);
    });

    const colorPicker = new ColorPicker(Blockly.getMainWorkspace());
    const randomColor = "#" + Math.random().toString(16).slice(-6);
    const RandomBlockColors = getFakeBlockColors(randomColor)
    const pickerIcon = createColorButton(RandomBlockColors);
    pickerIcon.classList.add("sa-rcb-colorPicker")
    pickerIcon.currentColor = randomColor
    pickerIcon.style.borderColor = "";

    pickerIcon.addEventListener("click", (e) => {
      e.stopPropagation();
      const currentColor = pickerIcon.currentColor;
      const blockColors = block.recolorCustomBlock ?? getFakeBlockColors(currentColor)
      setColorListActive(pickerIcon, currentColor, blockColors);
      const category = "more"
      colorPicker.showPopup(pickerIcon, currentColor, category, blockColors, (newColor) => {
        //Todo: Rate limiting?
        const newFakeColors = getFakeBlockColors(newColor)
        pickerIcon.currentColor = newColor;
        pickerIcon.style.backgroundColor = newFakeColors.colourPrimary;
        updateDeclarationPrefix(block, newColor)
      });
    });
    proceduresColorRow.appendChild(pickerIcon);
    block.colorMenu = proceduresColorRow;

    proceduresBody.addEventListener("click", (e) => {
      if(!e.target?.currentColor) { // Anything besides custom color button
        colorPicker.hidePopup();
      }
    });

  }
  // We use this to catch when procedures_declaration is rendered so we can modify
  // procedure_declaration's Blockly instance, and associated ui
  const oldBlockInitSvg = Blockly.BlockSvg.prototype.initSvg;
  Blockly.BlockSvg.prototype.initSvg = function (...args) {
    const initSvgResult = oldBlockInitSvg.call(this, ...args);
    if(this.type === "procedures_declaration" && !this.recolorCustomBlockInjected) {
      addColorMenu(this);
      shimOnChangeFn(this);
      handleBlock(this);
    }
    return initSvgResult;
  };


  // onChangeFn is called for every block, so we can shim it do recolor
  // the custom procedure options row and block
  const shimOnChangeFn = (block) => {
    // If we've already injected this, don't
    if(block.recolorCustomBlockInjected) return;
    block.recolorCustomBlockInjected = true;
    let oldOnChangeFn = block.onChangeFn;
    block.onChangeFn = function(...args) {
      oldOnChangeFn.call(this, ...args);
      // There's not an easy way to un-inject this when the addon is disabled
      // We just have to manually check it each time
      if(!addon.self.disabled) {
        handleBlock(this);
      }
    }
  }

  const enableAddon = () => {
    // Refreshing the blocks allows us to change displayName later
    updateExistingBlocks();
    if (addon.tab.redux.state.scratchGui.customProcedures.active) {
      // If the modal is open, we need to call handleBlock on the procedure_declaration to
      // get the shim injected and recolor the block if needed
      const editBlock = Blockly.getMainWorkspace()?.getTopBlocks?.()?.[0];
      if(editBlock?.type === "procedures_declaration") {
        addColorMenu(this);
        shimOnChangeFn(this);
        handleBlock(this);
      }
    }
  }

  if(Blockly.registry) {
    const oldApplyColour = Blockly.BlockSvg.prototype.applyColour;
    Blockly.BlockSvg.prototype.applyColour = function (...args) {
      if (!this.isInsertionMarker() && this.getStyleName() === "more") {
        const block = this.procCode_ && this.recolorCustomBlock;
        // If the block has a procCode and has been set to be recolored, recolor it
        if (block) {
          const color = this.recolorCustomBlock;
          this.style = {
            ...this.style,
            colourPrimary: color.colourPrimary,
            colourSecondary: color.colourSecondary,
            colourTertiary: color.colourTertiary,
            colourQuaternary: color.colourQuaternary
          };
          this.pathObject.setStyle(this.style);
          // Procedures prototype blocks set their tertiary color from their parents tertiary color
          if(this.type === "procedures_prototype") {
            const applyColorResult = oldApplyColour.call(this, ...args);
            this.style.colourTertiary = color.colourTertiary;
            this.pathObject.svgPath.setAttribute("stroke", color.colourTertiary);
            return applyColorResult;
          }
        }
      }
      return oldApplyColour.call(this, ...args);
    }
  } else {
    const oldUpdateColour = Blockly.BlockSvg.prototype.updateColour;
    Blockly.BlockSvg.prototype.updateColour = function (...args) {
      if (!this.isInsertionMarker() && this.getCategory?.() == null) {
        const block = this.procCode_ && this.recolorCustomBlock;
        if (block) {
          const color = this.recolorCustomBlock;
          this.colour_ = color.colourPrimary;
          this.colourSecondary_ = color.colourSecondary;
          this.colourTertiary_ = color.colourTertiary;
          this.colourQuaternary_ = color.colourQuaternary
          // Procedures prototype blocks set their tertiary color from their parents tertiary color
          if(this.type === "procedures_prototype") {
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


  const updateExistingBlocks = () => {
    updateAllBlocks(addon.tab)
    const workspace = addon.tab.traps.getWorkspace();
    const flyout = workspace && workspace.getFlyout();
    if (workspace && flyout) {
      const allBlocks = [...workspace.getAllBlocks(), ...flyout.getWorkspace().getAllBlocks()];
      for (const block of allBlocks) {
        handleBlock(block);
      }
    }
    if (addon.tab.redux.state.scratchGui.customProcedures.active) {

      const declarationBlock = Blockly.getMainWorkspace()?.getTopBlocks?.()?.[0];
      if (declarationBlock?.type === "procedures_declaration") {
        handleBlock(this);
      }
    }
  }
  // Creates a modified version of a block's createAllInputs_ function
  const customCreateAllInputs = (oldCreateAllInputs) => {
    return function(...args) {
      if (addon.self.disabled) return oldCreateAllInputs.call(this, ...args);
      handleBlock(this);
      const prefixEnd = this.recolorCustomBlock?.prefixEnd;
      if (prefixEnd && addon.settings.get("hideColorPrefix")) {
        const originalProcCode = this.procCode_;
        this.procCode_ = this.procCode_.slice(prefixEnd);
        const ret = oldCreateAllInputs.call(this, ...args);
        this.procCode_ = originalProcCode;
        return ret;
      }
      return oldCreateAllInputs.call(this, ...args);
    }
  }
  // Pollute procedures_call's and procedures_prototype's createAllInputs_ functions
  for(const fn of ["procedures_call", "procedures_prototype"]) {
    if(Blockly.registry) {
      const oldInit = Blockly.Blocks[fn].init;
      Blockly.Blocks[fn].init = function(...args) {
        const initResult = oldInit.call(this, ...args);
        const oldCreateAllInputs = this.createAllInputs_;
        this.createAllInputs_ = customCreateAllInputs(oldCreateAllInputs);
        return initResult;
      }
    } else {
      const originalCreateAllInputs = Blockly.Blocks[fn].createAllInputs_;
      Blockly.Blocks[fn].createAllInputs_ = customCreateAllInputs(originalCreateAllInputs);
    }
  }

  // toolbox.refreshTheme doesn't trigger applyColour or initSvg, so we need to apply our changes manually
  if(Blockly.registry) {
    const toolbox = addon.tab.traps.getWorkspace().getToolbox();
    const oldRefreshTheme = toolbox.refreshTheme;
    toolbox.refreshTheme = function (...args) {
      setTimeout(updateExistingBlocks, 0);
      return oldRefreshTheme.call(this, ...args)
    }
  }

  addon.self.addEventListener("disabled", () => updateAllBlocks(addon.tab));
  addon.self.addEventListener("reenabled", () => enableAddon());
  addon.settings.addEventListener("change", () => updateAllBlocks(addon.tab));

  enableAddon();

}
