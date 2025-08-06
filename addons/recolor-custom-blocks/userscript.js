import {updateAllBlocks} from "../../libraries/common/cs/update-all-blocks.js";

const uriHeader = "data:image/svg+xml;base64,"

export default async function ({ addon, msg, console }) {

  const Blockly = await addon.tab.traps.getBlockly();

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
      block.colorButton.style.background = colors.colourPrimary;
      block.colorButton.style.borderColor = colors.colourTertiary;

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
          if (box_ && !box_.editorTheme3) {
            box_.setAttribute('fill', colors.colourTertiary);
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

  const updateDeclarationPrefix = (block, prefix, categoryField) => {
    const recolorCustomBlock = block.recolorCustomBlock;
    if(recolorCustomBlock?.isEdited) {
      block.procCode_ = block.procCode_.slice(recolorCustomBlock?.prefixEnd);
    }
    if(prefix === "reset") {
      categoryField.setValue();
    } else {
      block.procCode_ = prefix + ":" + block.procCode_;
    }
    block.updateDisplay_();
  }
  // Make a fake block with a dropdown to allow us to display dropdown menus
  const addColorChangeMenu = (block) => {
    Blockly.Blocks["recolorcategorymenu"] = {}; // Needs to exist for new Blockly
    // Get a svg representation of the block, so that jsonInit thinks it's real
    let recolorcategorymenublock = new Blockly.BlockSvg(Blockly.getMainWorkspace(),"recolorcategorymenu");
    // Call jsonInit on our fake block, which ends up creating the field dropdown we want
    Blockly.Block.prototype.jsonInit.call(recolorcategorymenublock,{
      "type": "recolorcategorymenublock",
      "message0": "%1",
      "args0": [
        {
          "type": "field_dropdown",
          "name": "STYLE",
          "options": [
            [Blockly.Msg.CATEGORY_MOTION, "motion"],
            [Blockly.Msg.CATEGORY_LOOKS, "looks"],
            [Blockly.Msg.CATEGORY_SOUND, "sounds"],
            [Blockly.Msg.CATEGORY_EVENTS, "event"],
            [Blockly.Msg.CATEGORY_CONTROL, "control"],
            [Blockly.Msg.CATEGORY_SENSING, "sensing"],
            [Blockly.Msg.CATEGORY_OPERATORS, "operators"],
            [Blockly.Msg.CATEGORY_VARIABLES, "data"],
            [scratchAddons.l10n.messages["data-category-tweaks-v2/list-category"] ?? Blockly.Msg.LIST_MODAL_TITLE, "data_lists"],
            [addon.tab.redux.state.locales.messages["gui.extension.pen.name"], "pen"],
            ["-", "reset"],
          ],
        }
      ]
    });
    const categoryField = recolorcategorymenublock.inputList[0].fieldRow[0];
    // To show the popup, we need fieldGroup_.getBoundingClientRect to be valid, as it's used to
    // determine where the block is placed
    categoryField.fieldGroup_ = {};

    // Get results from onItemSelected
    const onItemSelectedMethodName = Blockly.registry ? "onItemSelected_" : "onItemSelected";
    let oldOnItemSelected = categoryField[onItemSelectedMethodName];
    categoryField[onItemSelectedMethodName] = function(...args) {
      updateDeclarationPrefix(block, args[1].getValue(),categoryField);
      return oldOnItemSelected.apply(this, args);
    }

    // Create the menu item in the block edit screen
    const proceduresBody = document.querySelectorAll("[class^=custom-procedures_body_]")?.[0];
    if(proceduresBody) {
      proceduresBody.addEventListener("click", (e) => {
          if(e.target.className === "recolorCustomBlockButton") return;
          Blockly.DropDownDiv.hideWithoutAnimation();
      })
      // Main color button
      const colorButton = document.createElement("button");
      colorButton.style.background = getBlocklyColors("more").colourPrimary;
      colorButton.style.borderColor = getBlocklyColors("more").colourTertiary;

      colorButton.classList.add("recolorCustomBlockButton")
      colorButton.addEventListener("click", (e) => {
        // Make the menu's colors match the block
        if(Blockly.registry) {
          recolorcategorymenublock.style = block.style;
        } else {
          recolorcategorymenublock.colour_ = block.colour_;
          recolorcategorymenublock.colourSecondary_ = block.colourSecondary_;
          recolorcategorymenublock.colourTertiary_ = block.colourTertiary_;
          recolorcategorymenublock.colourQuaternary = block.colourQuaternary_;
        }

        // Make the selected item match the block's prefix
        const prefix = block?.recolorCustomBlock?.prefix;
        if(prefix) {
          const matchingPrefix = categoryField.menuGenerator_.find((item) => item[1] === prefix);
          if(!matchingPrefix) {
            categoryField.menuGenerator_.push([prefix, prefix]);
          }
          categoryField.setValue(prefix);
        } else {
          categoryField.setValue("reset");
        }

        // Make the menu appear over the button
        categoryField.fieldGroup_.getBoundingClientRect = function() {
          return colorButton.getBoundingClientRect();
        }
        // Show the menu
        categoryField.showEditor_();
      });

      // Extra elements to match layout of other menu items
      const span = document.createElement("span");
      span.innerHTML = addon.tab.redux.state.locales.messages["gui.howtos.animate-char.step_changecolor"] ?? "Change Color";
      const label = document.createElement("label");
      label.appendChild(colorButton);
      label.appendChild(span);
      const div = document.createElement("div");
      div.classList.add("custom-procedures_color_row");
      div.appendChild(label);
      proceduresBody.insertBefore(div, proceduresBody.lastChild);

      // When the block is updated, we want to be able to recolor the button
      block.colorButton = colorButton;
    }

  }
  // We use this to catch when procedures_declaration is rendered so we can modify
  // procedure_declaration's Blockly instance, and associated ui
  const oldBlockInitSvg = Blockly.BlockSvg.prototype.initSvg;
  Blockly.BlockSvg.prototype.initSvg = function (...args) {
    const initSvgResult = oldBlockInitSvg.call(this, ...args);
    if(this.type === "procedures_declaration" && !this.recolorCustomBlockInjected) {
      addColorChangeMenu(this);
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
        handleBlock(editBlock);
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
