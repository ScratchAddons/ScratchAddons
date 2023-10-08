/**
 * @file Contains the code for rendering the blocks in the middle click dropdown.
 * Main function is {@link renderBlock} which takes in a block and returns a renderer SVG element.
 * @author Tacodiva
 */

import { BlockShape, BlockInstance, BlockInputEnum, BlockInputBoolean, BlockInputBlock } from "./BlockTypeInfo.js";
import { getTextWidth } from "./module.js";

const SVG_NS = "http://www.w3.org/2000/svg";

const BlockShapes = {
  // eg (my variable)
  Round: {
    padding: 12,
    minWidth: 20,
    backgroundPath: (width) => `m -12 -20 m 20 0 h ${width - 16} a 20 20 0 0 1 0 40 H 8 a 20 20 0 0 1 0 -40 z`,

    /**
     * 'Snuggling' is my wholesome term for when a block can sit extra close to a block
     * of the same shape as it. Take a look at the blocks ( ( "" + "" ) - "" ) and
     * ( < "" = "" > - "" ), observe how there's a lot more blank space in the outer
     * block in the second example, this is because in the first example the '+' block
     * can snuggle with the '-' block.
     */
    snugglePadding: 0,
    get snuggleWith() {
      // Don't feel bad BlockShapes.Round, I only snuggle with myself too :_(
      return [BlockShapes.Round];
    },
  },

  // eg <() = ()>
  Boolean: {
    padding: 20,
    minWidth: 20,
    backgroundPath: (width) => `m -20 -20 m 20 0 h ${width} l 20 20 l -20 20 H 0 l -20 -20 l 20 -20 z`,

    snugglePadding: 0,
    get snuggleWith() {
      return [BlockShapes.Boolean];
    },
  },

  // Square dropdowns like variables
  SquareInput: {
    padding: 8,
    minWidth: 20,
    backgroundPath: (width) =>
      `m -2 -16 h ${width + 4} a 4 4 0 0 1 4 4 V 12 a 4 4 0 0 1 -4 4 H -2 a 4 4 0 0 1 -4 -4 V -12 a 4 4 0 0 1 4 -4`,
  },

  // eg show
  Stack: {
    padding: 8,
    minWidth: 60,
    backgroundPath: (width) =>
      `m -8 -20 A 4 4 0 0 1 -4 -24 H 4 c 2 0 3 1 4 2 l 4 4 c 1 1 2 2 4 2 h 12 c 2 0 3 -1 4 -2 l 4 -4 C 37 -23 38 -24 40 -24 H ${width} a 4 4 0 0 1 4 4 v 40 a 4 4 0 0 1 -4 4 H 40 c -2 0 -3 1 -4 2 l -4 4 c -1 1 -2 2 -4 2 h -12 c -2 0 -3 -1 -4 -2 l -4 -4 c -1 -1 -2 -2 -4 -2 H -4 a 4 4 0 0 1 -4 -4 z`,
  },

  // eg when I start as a clone
  Hat: {
    padding: 8,
    minWidth: 60,
    backgroundPath: (width) =>
      `m -8 -20 A 4 4 0 0 1 -4 -24 H ${width} a 4 4 0 0 1 4 4 v 40 a 4 4 0 0 1 -4 4 H 40 c -2 0 -3 1 -4 2 l -4 4 c -1 1 -2 2 -4 2 h -12 c -2 0 -3 -1 -4 -2 l -4 -4 c -1 -1 -2 -2 -4 -2 H -4 a 4 4 0 0 1 -4 -4 z`,
  },

  // eg delete this clone
  End: {
    padding: 8,
    minWidth: 60,
    backgroundPath: (width) =>
      `m -8 -20 A 4 4 0 0 1 -4 -24 H 4 c 2 0 3 1 4 2 l 4 4 c 1 1 2 2 4 2 h 12 c 2 0 3 -1 4 -2 l 4 -4 C 37 -23 38 -24 40 -24 H ${width} a 4 4 0 0 1 4 4 v 40 a 4 4 0 0 1 -4 4 H -4 a 4 4 0 0 1 -4 -4 z`,
  },

  // The white oval for text or number inputs
  TextInput: {
    padding: 12,
    minWidth: 16,
    backgroundPath: (width) => `m -12 -16 m 16 0 h ${width - 8} a 16 16 0 0 1 0 32 H 4 a 16 16 0 0 1 0 -32 z`,

    snugglePadding: 4,
    get snuggleWith() {
      return [BlockShapes.Round];
    },
  },

  BooleanInput: {
    padding: 16,
    minWidth: 16,
    backgroundPath: (width) => `m 0 -16 h ${width} l 16 16 l -16 16 h -16 l -16 -16 l 16 -16 z`,

    snugglePadding: 6,
    get snuggleWith() {
      return [BlockShapes.Boolean];
    },
  },

  HorizontalBlock: {
    padding: 16,
    minWidth: 45,
    backgroundPath: (width) =>
      `M -4 -20 a 4 4 0 0 1 4 -4 H ${
        width + 8
      } a 4 4 0 0 1 4 4 v 2 c 0 2 -1 3 -2 4 l -4 4 c -1 1 -2 2 -2 4 v 12 c 0 2 1 3 2 4 l 4 4 c 1 1 2 2 2 4 v 2 a 4 4 0 0 1 -4 4 H 0 a 4 4 0 0 1 -4 -4 v -2 c 0 -2 -1 -3 -2 -4 l -4 -4 c -1 -1 -2 -2 -2 -4 v -12 c 0 -2 1 -3 2 -4 l 4 -4 c 1 -1 2 -2 2 -4 z`,
  },

  HorizontalBlockEnd: {
    padding: 16,
    minWidth: 45,
    backgroundPath: (width) =>
      `M -4 -20 a 4 4 0 0 1 4 -4 H ${
        width + 8
      } a 4 4 0 0 1 4 4 V 20 a 4 4 0 0 1 -4 4 H 0 a 4 4 0 0 1 -4 -4 v -2 c 0 -2 -1 -3 -2 -4 l -4 -4 c -1 -1 -2 -2 -2 -4 v -12 c 0 -2 1 -3 2 -4 l 4 -4 c 1 -1 2 -2 2 -4 z`,
  },
};

/**
 * Gets the block shape info from {@link BlockShapes} given a {@link BlockShape}.
 * @param {BlockShape} shape
 */
function getShapeInfo(shape, isVertical) {
  if (shape === BlockShape.Round) return BlockShapes.Round;
  if (shape === BlockShape.Boolean) return BlockShapes.Boolean;
  if (shape === BlockShape.Stack) return isVertical ? BlockShapes.Stack : BlockShapes.HorizontalBlock;
  if (shape === BlockShape.Hat) return BlockShapes.Hat;
  if (shape === BlockShape.End) return isVertical ? BlockShapes.End : BlockShapes.HorizontalBlockEnd;
  throw new Error(shape);
}

/**
 * @param {BlockInstance} block
 * @returns {number}
 */
export function getBlockHeight(block) {
  switch (block.typeInfo.shape) {
    case BlockShape.End:
    case BlockShape.Hat:
    case BlockShape.Stack:
      return 62;
    case BlockShape.Boolean:
    case BlockShape.Round:
      return 48;
  }
  return 0;
}

const BLOCK_ELEMENT_SPACING = 8;

/**
 * A part of a block. Think of these like the different parts in the 'make a block' menu.
 */
export class BlockComponent {
  constructor(element, padding, width, snuggleWith, snugglePadding) {
    this.dom = element;
    this.padding = padding;
    this.width = width;
    this.snuggleWith = snuggleWith;
    this.snugglePadding = snugglePadding;
  }
}

/**
 * Creates a BlockComponent with some text. Like the 'label' element in the make a block menu.
 * @param {string} text The contents of the component.
 * @param {SVGElement} container The element to add the text to.
 * @returns {BlockComponent} The BlockComponent.
 */
function createTextComponent(text, fillVar, container) {
  let textElement = container.appendChild(document.createElementNS(SVG_NS, "text"));
  textElement.setAttribute("class", "blocklyText");
  textElement.style.fill = `var(${fillVar})`;
  textElement.setAttribute("dominant-baseline", "middle");
  textElement.setAttribute("dy", 1);
  textElement.appendChild(document.createTextNode(text));
  return new BlockComponent(textElement, 0, getTextWidth(textElement));
}

/**
 * Creates a DOM element to hold all the contents of a block.
 * A block could be the top level block, or it could be a block like (() + ()) that's inside
 * another block.
 * @returns {SVGElement} The SVGElement which will contain all the block's components.
 */
function createBlockContainer() {
  let container = document.createElementNS(SVG_NS, "g");
  let background = document.createElementNS(SVG_NS, "path");
  background.setAttribute("class", "blocklyPath");
  container.appendChild(background);
  return container;
}

/**
 * Creates a block component from a container containing all its components.
 * @param {SVGElement} container The block container, created by {@link createBlockContainer}.
 * @param {object} shape An object containing information of the shape of the block to be created. From the {@link BlockShapes} object.
 * @param {string} categoryClass The category of the block, used for filling the background.
 * @param {string} fill
 * @param {string} stroke
 * @param {number} width The width of the background of the block.
 */
function createBlockComponent(container, shape, categoryClass, fill, stroke, width) {
  if (width < shape.minWidth) width = shape.minWidth;
  container.classList.add("sa-block-color", categoryClass);
  const background = container.children[0];
  let style = "";
  if (fill) style += `fill: var(${fill});`;
  if (stroke) style += `stroke: var(${stroke});`;
  background.setAttribute("style", style);
  background.setAttribute("d", shape.backgroundPath(width));
  return new BlockComponent(
    container,
    shape.padding,
    width + shape.padding * 2,
    shape.snuggleWith,
    shape.snugglePadding
  );
}

function createBackedTextedComponent(text, container, shape, categoryClass, fill, stroke, textVar) {
  const blockContainer = createBlockContainer();
  container.appendChild(blockContainer);
  const textElement = createTextComponent(text, textVar, blockContainer);
  if (textElement.width < shape.minWidth) {
    textElement.dom.setAttribute("x", (shape.minWidth - textElement.width) / 2);
  }

  const blockElement = createBlockComponent(blockContainer, shape, categoryClass, fill, stroke, textElement.width);
  return blockElement;
}

/**
 * Renders a block, with the center of it's leftmost side located at 0, 0.
 * @param {BlockInstance} block
 * @param {SVGElement} container
 * @returns {BlockComponent} The rendered block
 */
export default function renderBlock(block, container) {
  var blockComponent = _renderBlock(block, container, block.typeInfo.category, true);
  blockComponent.dom.classList.add("sa-block-color");
  blockComponent.dom.setAttribute("transform", `translate(${blockComponent.padding}, 0)`);
  return blockComponent;
}

/**
 * Renders a block, with the center of it's leftmost side located at 0, 0.
 * @param {BlockInstance} block
 * @param {SVGAElement} container
 * @param {string} parentCategory The category of this blocks parent. If no parent, than this blocks category.
 * @returns {BlockComponent} The rendered component.
 */
function _renderBlock(block, container, parentCategory, isVertical) {
  const blockContainer = container.appendChild(createBlockContainer());
  const shape = getShapeInfo(block.typeInfo.shape, isVertical);
  const category = block.typeInfo.category;
  const categoryClass = "sa-block-color-" + category.name;

  let xOffset = 0;
  let inputIdx = 0;

  for (let partIdx = 0; partIdx < block.typeInfo.parts.length; partIdx++) {
    const blockPart = block.typeInfo.parts[partIdx];

    let component;
    if (typeof blockPart === "string") {
      component = createTextComponent(blockPart, "--sa-block-text", blockContainer);
    } else {
      const blockInput = block.inputs[inputIdx++];
      if (blockInput instanceof BlockInstance) {
        component = _renderBlock(blockInput, blockContainer, block.typeInfo.category, false);
      } else if (blockPart instanceof BlockInputEnum) {
        if (blockPart.isRound) {
          component = createBackedTextedComponent(
            blockInput.string,
            blockContainer,
            BlockShapes.TextInput,
            categoryClass,
            `--sa-block-background-secondary, ${category.colorSecondary}`,
            `--sa-block-background-tertiary, ${category.colorTertiary}`,
            "--sa-block-text"
          );
        } else {
          component = createBackedTextedComponent(
            blockInput.string,
            blockContainer,
            BlockShapes.SquareInput,
            categoryClass,
            `--sa-block-background-primary, ${category.colorPrimary}`,
            `--sa-block-background-tertiary, ${category.colorTertiary}`,
            "--sa-block-text"
          );
        }
      } else if (blockPart instanceof BlockInputBoolean) {
        component = createBackedTextedComponent(
          "",
          blockContainer,
          BlockShapes.BooleanInput,
          categoryClass,
          `--sa-block-field-background, ${category.colorTertiary}`,
          `--sa-block-field-background, ${category.colorTertiary}`,
          "--sa-block-text"
        );
      } else if (blockPart instanceof BlockInputBlock) {
        component = createBackedTextedComponent(
          "",
          blockContainer,
          BlockShapes.HorizontalBlock,
          categoryClass,
          `--sa-block-field-background, ${category.colorTertiary}`,
          `--sa-block-field-background, ${category.colorTertiary}`,
          "--sa-block-text"
        );
      } else {
        component = createBackedTextedComponent(
          blockInput?.toString() ?? blockPart.defaultValue ?? "",
          blockContainer,
          BlockShapes.TextInput,
          categoryClass,
          `--sa-block-input-color, ${category.colorColor}`,
          `--sa-block-background-tertiary, ${category.colorTertiary}`,
          "--sa-block-input-text"
        );
        component.dom.classList.add("blocklyNonEditableText");
      }
    }

    let xTranslation = xOffset + component.padding;

    if (partIdx === 0 || partIdx === block.typeInfo.parts.length - 1) {
      if (component.snuggleWith && component.snuggleWith.indexOf(shape) !== -1) {
        const positionDelta = component.snugglePadding - component.padding;
        component.width += positionDelta;

        if (partIdx === 0) {
          xTranslation += positionDelta;
        }
      }
    }

    component.dom.setAttribute("transform", `translate(${xTranslation}, 0)`);
    xOffset += BLOCK_ELEMENT_SPACING + component.width;
  }

  return createBlockComponent(
    blockContainer,
    shape,
    categoryClass,
    `--sa-block-background-primary, ${category.colorPrimary}`,
    `--sa-block-background-tertiary, ${category.colorTertiary}`,
    xOffset - BLOCK_ELEMENT_SPACING
  );
}
