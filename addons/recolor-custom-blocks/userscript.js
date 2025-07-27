
import { updateAllBlocks } from "../../libraries/common/cs/update-all-blocks.js";

const uriHeader = "data:image/svg+xml;base64,";

export default async function ({ addon, msg, console }) {
  const Blockly = await addon.tab.traps.getBlockly();
  const vm = addon.tab.traps.vm;

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
      primary: hexString,
      secondary: multiply(hexString, { r: 0.9, g: 0.9, b: 0.9 }),
      tertiary: multiply(hexString, { r: 0.8, g: 0.8, b: 0.8 }),
      quaternary: multiply(hexString, { r: 0.8, g: 0.8, b: 0.8 })
    }
  }

  const blockHasColor = (block, colors) => {
    return block.getColour() === colors.primary &&
           block.getColourSecondary() === colors.secondary &&
           block.getColourTertiary() === colors.tertiary &&
           block.getColourQuaternary() === colors.quaternary;
  }

  const setProcedureButtonColor = (iconElement, colors) => {
    let svg = atob(iconElement.src.replace(uriHeader, ""));

    // To change the menu item colors, we are inserting our own css after scratch's in the style tag
    // We want to avoid adding unneeded styling, so we keep our changes after the "ccbc edit" comment
    // This allows us to remove old changes, and not be negatively effected by theme3 recoloring them
    const editedComment = "/*rcb edit*/";
    const endStyleIndex = svg.indexOf("</style>");
    const editedCommentIndex = svg.indexOf(editedComment);
    const appendedStyles = editedComment + ".cls-3{fill:" + colors.primary + ";}.cls-3,.cls-4{stroke:" + colors.tertiary + ";}.cls-4{fill:" + colors.secondary + ";}text.cls-4{fill:#fff;stroke:unset;}"
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
    debugger;

    // If the color is already set to colors, don't do it again
    if(blockHasColor(block, colors)) {
      return
    }
    block.setColourFromRawValues_(colors.primary, colors.secondary, colors.tertiary, colors.quaternary);
    block.recolorCustomBlocksIsEdited = isEdited;
    if(block.type === "procedures_declaration") {
      // In the custom block editing screen, we need to recolor text input's rings and all child blocks
      block.inputList.forEach((input) => {
        if(input.fieldRow.length !== 0) {
          input.fieldRow.forEach((row) => {
            row.box_.setAttribute("fill", colors.tertiary);
          })
        }
      })
      block.getChildren().forEach((child) => {
        child.setColourFromRawValues_(child.getColour(), child.getColourSecondary(), colors.tertiary,  child.getColourQuaternary());
        child.recolorCustomBlocksIsEdited = isEdited;
      })
      // And we need to update the custom procedure options row
      setCustomProcedureOptionsColor(colors)

    } else if(block.type === "procedures_prototype") {
      // For some reason, switching colors from the custom procedure menu sets
      // procedures_prototype's child block's tertiary color to the previous tertiary color.
      block.getChildren().forEach((child) => {
        // For if some reason someone puts a non argument reporter in the procedures_prototype
        const correctTertiaryColor = Blockly.Colours[child.getCategory() ?? "more"].tertiary
        child.setColourFromRawValues_(child.getColour(), child.getColourSecondary(), correctTertiaryColor, child.getColourQuaternary());
        child.recolorCustomBlocksIsEdited = isEdited
      });
    } else {
      // Elsewise, we need to recolor the text inputs on the block
      block.getChildren().forEach((child) => {
        if(child.type === "text") {
          child.setColourFromRawValues_(child.getColour(), child.getColourSecondary(), colors.tertiary, child.getColourQuaternary());
          child.recolorCustomBlocksIsEdited = isEdited
        }
      });
    }

  }

  const getTextContent = (block) => {
    // If the block has rendered on the screen, get the text displayed. This allows us to catch reporters
    const text_ = block.inputList?.[0]?.fieldRow?.[0]?.text_;
    if(text_ && text_ !== "") {
      return text_;
    }
    // If that doesn't work, check the block's procCode for info.
    const procCode_ = block.procCode_;
    if(procCode_ && procCode_ !== "") {
      return procCode_;
    }
    // If that fails, we need to interrogate the vm for block details
    const blocks = vm.editingTarget?.blocks;
    if(blocks) {
      const vmBlock = blocks.getBlock(block.id);
      // If the vm can't even find anything, give up
      if(!vmBlock) {
        return "";
      }
      const proccode = vmBlock.mutation?.proccode;
      if(proccode && proccode !== "") {
        return proccode;
      }
      const value = vmBlock.fields?.VALUE?.value;
      if(value && value !== "") {
        return value;
      }
    }
    return "";
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
  };

  const handleBlock = (block) => {
    const type = block.type ?? "";
    // We want to only color custom procedures, and not their arguments.
    // Custom procedures dragged from the flyout have type "text", so we check if it's parent has custom colors (meaning it would have to be an argument)
    if(block.getCategory() !== null || type.startsWith("argument") || block.getParent()?.recolorCustomBlocksIsEdited === true) {
      return;
    }
    const textContent = getTextContent(block);

    // Color formatting done with "color:"
    const firstColonIndex = textContent.indexOf(":");
    if(firstColonIndex !== -1) {
      const colorCandidateString = textContent.substring(0,firstColonIndex);

      const colorCandidate = Blockly.Colours[colorCandidateString]
      // Blockly.Colours contains string entries, which we don't want to accidentally select
      if(colorCandidate && typeof colorCandidate === "object") {
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
    if(block.recolorCustomBlocksIsEdited) {
      setBlockColor(block, Blockly.Colours[block.getCategory() ?? "more"], false);
    }
  }

  const originalRender = Blockly.BlockSvg.prototype.render;
  Blockly.BlockSvg.prototype.render = function (opt_bubble) {
    const original = originalRender.call(this, opt_bubble);
    handleBlock(this);
    return original;
  };

  addon.tab.redux.initialize();
  addon.tab.redux.addEventListener("statechanged", (e) => {
    // Toolbox updates fire when switching between sprites & stage, when custom blocks are edited,
    // and when the project first loads, which is exactly when Blockly.BlockSvg.prototype.render
    // doesn't fire
    if (e.detail.action.type === "scratch-gui/toolbox/UPDATE_TOOLBOX") {
      // Timeout to wait until the elements are rendered
      setTimeout(updateExistingBlocks, 0);
    }
  });

  addon.settings.addEventListener("change", () => updateExistingBlocks());
  addon.self.addEventListener("disabled", () => updateAllBlocks(addon.tab));
  addon.self.addEventListener("reenabled", () => updateExistingBlocks());
  updateExistingBlocks();



}
