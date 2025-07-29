const uriHeader = "data:image/svg+xml;base64,"

export default async function ({ addon, msg, console }) {

  const Blockly = await addon.tab.traps.getBlockly();

  let originalUpdateDeclarationProcCode;

  const hexToRGB = (hexString) => {
    const decimal = parseInt(hexString.substring(1), 16);
    return {r: decimal >> 16, g: decimal >> 8 & 255, b: decimal & 255};
  }
  const RGBtoHex = (rgb) => {
    return "#" + ((rgb.b | rgb.g << 8 | rgb.r << 16) | 1 << 24).toString(16).slice(1);
  }
  const multiply = (hexString, {r, g, b}) => {
    const c = hexToRGB(hexString);
    const multiplied = {r: r * c.r, g: g * c.g, b: b * c.b}
    return RGBtoHex(multiplied);
  }

  const isHexColor = (hexString) => {
    if(!hexString.startsWith("#")) {
      return false
    }
    const hex = hexString.substring(1);
    return typeof hex === 'string' && hex.length === 6 && !isNaN(Number('0x' + hex))
  }

  // Best guess colors given a target block color
  const getFakeBlockColors = (hexString) => {
    return {
      colourPrimary: hexString,
      colourSecondary: multiply(hexString, { r: 0.9, g: 0.9, b: 0.9 }),
      colourTertiary: multiply(hexString, { r: 0.8, g: 0.8, b: 0.8 }),
      colourQuaternary: multiply(hexString, { r: 0.8, g: 0.8, b: 0.8 })
    }
  }
  // Standardize colour names between Blockly verions
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
        colourQuaternary: colors.colourQuaternary
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
    // We want to avoid adding unneeded styling, so we keep our changes after the "ccbc edit" comment
    // This allows us to remove old changes, and not be negatively effected by theme3 recoloring them
    const editedComment = "/*rcb edit*/";
    const endStyleIndex = svg.indexOf("</style>");
    const editedCommentIndex = svg.indexOf(editedComment);
    const appendedStyles = editedComment + ".cls-3{fill:" + colors.colourPrimary + ";}.cls-3,.cls-4{stroke:" + colors.colourTertiary + ";}.cls-4{fill:" + colors.colourSecondary + ";}text.cls-4{fill:#fff;stroke:unset;}"
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
      const imgElements = optionsRowElement.getElementsByTagName('img')
      for(const element of imgElements) {
        setProcedureButtonColor(element, colors)
      }
    }
  }

  const setBlockColor = (block, colors, isEdited) => {
    // If we've already set this color, don't
    if(blockHasColor(block, colors)) {
      return
    }
    //
    if(!block.recolorCustomBlock) {
      block.recolorCustomBlock = {}
    }
    // We're storing our custom colors on a separate part of the block object
    // This is used by Blockly's applyColour / updateColour methods later
    block.recolorCustomBlock.colourPrimary = colors.colourPrimary;
    block.recolorCustomBlock.colourSecondary = colors.colourSecondary;
    block.recolorCustomBlock.colourTertiary = colors.colourTertiary;
    block.recolorCustomBlock.colourQuaternary = colors.colourQuaternary;
    block.recolorCustomBlock.isEdited = isEdited;

    if(Blockly.registry) {
      block.applyColour()
    } else {
      block.updateColour(this)
    }

    if(block.type === "procedures_declaration") {
      // If there's a procedures_declaration, we're in the custom block editing screen
      // and need to recolor the buttons
      setCustomProcedureOptionsColor(colors);
      // Old blockly doesn't update the box color of fields in a procedures_declaration
      if(!Blockly.registry) {
        block.inputList.forEach((input) => {
          const box_ = input.fieldRow?.[0]?.box_
          if (box_) {
            box_.setAttribute('fill', block.getColourTertiary());
          }
        });
      }
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
        setBlockColor(block, colorCandidate, true);
        return;
      }
      // If we can get a valid Hex color from the colorCandidateString, make fake colors
      // for it and set the block color
      if(isHexColor(colorCandidateString)) {
        const fakeColor = getFakeBlockColors(colorCandidateString);
        setBlockColor(block, fakeColor, true);
        return;
      }


    }
    // If the block doesn't qualify for a color change, check to see if it needs to be reverted
    if(block.recolorCustomBlock?.isEdited) {
      setBlockColor(block, getBlocklyColors("more"), false);
    }
  }

  // Allows us to catch most cases of blocks needing to be colored.
  // Does not catch live-updating the procedure_declaration blocks, or changes to blocks
  // after they've been edited
  const oldBlockInitSvg = Blockly.BlockSvg.prototype.initSvg;
  Blockly.BlockSvg.prototype.initSvg = function (...args) {
    handleBlock(this)
    return oldBlockInitSvg.call(this, ...args);
  };

  function getExistingProceduresDeclarationBlock() {
    // addon.tab.traps.getWorkspace() will never return the procedure declaration editor
    return Blockly.getMainWorkspace()
        .getAllBlocks()
        .find((block) => block.type === "procedures_declaration");
  }
  function polluteProcedureDeclaration(procedureDeclaration) {
    procedureDeclaration.onChangeFn = function (...args) {
      originalUpdateDeclarationProcCode.call(this, ...args);
      // This is called every time the procedures_declaration block is updated, allowing
      // us to change the block in real-time
      if(!addon.self.disabled) {
        handleBlock(this);
      }
    };
  }
  // We want Blockly to insert our changes to onChangeFn, so we throw our changes
  // into procedures_declaration's init. No more weird redux event problems!
  const originalInit = Blockly.Blocks["procedures_declaration"].init;
  Blockly.Blocks["procedures_declaration"].init = function () {
    originalInit.call(this);
    originalUpdateDeclarationProcCode = this.onChangeFn;
    polluteProcedureDeclaration(this);
  };

  if(Blockly.registry) {
    const oldApplyColour = Blockly.BlockSvg.prototype.applyColour;
    Blockly.BlockSvg.prototype.applyColour = function (...args) {
      if (!this.isInsertionMarker() && this.getStyleName() === "more") {
        const block = this.procCode_ && this.recolorCustomBlock
        // If the block has a procCode and has been set to be recolored, recolor it
        if (block) {
          const color = this.recolorCustomBlock
          this.style = {
            ...this.style,
            colourPrimary: color.colourPrimary,
            colourSecondary: color.colourSecondary,
            colourTertiary: color.colourTertiary,
            colourQuaternary: color.colourQuaternary
          };
          this.pathObject.setStyle(this.style);
          this.customContextMenu = null;
        }
      }
      return oldApplyColour.call(this, ...args);
    }
  } else {
    const oldUpdateColour = Blockly.BlockSvg.prototype.updateColour;
    Blockly.BlockSvg.prototype.updateColour = function (...args) {
      if (!this.isInsertionMarker() && this.getCategory?.() == null) {
        const block = this.procCode_ && this.recolorCustomBlock
        if (block) {
          const color = this.recolorCustomBlock
          this.colour_ = color.colourPrimary;
          this.colourSecondary_ = color.colourSecondary;
          this.colourTertiary_ = color.colourTertiary;
          this.colourQuaternary_ = color.colourQuaternary
          this.customContextMenu = null;
        }
      }
      return oldUpdateColour.call(this, ...args);
    };
  }


  const updateExistingBlocks = () => {
    const workspace = addon.tab.traps.getWorkspace();
    const flyout = workspace && workspace.getFlyout();
    if (workspace && flyout) {
      const allBlocks = [...workspace.getAllBlocks(), ...flyout.getWorkspace().getAllBlocks()];
      for (const block of allBlocks) {
        handleBlock(block);
      }
    }
  }

  addon.tab.redux.initialize();
  addon.tab.redux.addEventListener("statechanged", (e) => {
    // We need to catch updates from editing a custom procedure, as Blockly.BlockSvg.prototype.initSvg doesn't
    if (e.detail.action.type === "scratch-gui/custom-procedures/DEACTIVATE_CUSTOM_PROCEDURES") {
      // Timeout to wait until the elements are rendered
      setTimeout(updateExistingBlocks, 0);
    }
  });

  addon.self.addEventListener("disabled", () => updateExistingBlocks());
  addon.self.addEventListener("reenabled", () => updateExistingBlocks());
  // If the custom block screen is already open, update it with our onChangeFn
  if (addon.tab.redux.state.scratchGui.customProcedures.active) {
    polluteProcedureDeclaration(getExistingProceduresDeclarationBlock());
  }
  updateExistingBlocks();

}
