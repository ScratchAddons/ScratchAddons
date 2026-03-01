import { getSortedParameters } from "./blocks.js";

function assert(bool, message) {
  if (!bool) {
    throw new Error(`Assertion failed! ${message || ""}`);
  }
}

export class Label {
  constructor(value) {
    this.value = value;
  }
  get isLabel() {
    return true;
  }
}

export class Icon {
  constructor(name) {
    this.name = name;

    assert(Icon.icons[name], `no info for icon ${name}`);
  }
  get isIcon() {
    return true;
  }

  static get icons() {
    return {
      greenFlag: true,
      stopSign: true,
      turnLeft: true,
      turnRight: true,
      loopArrow: true,
      addInput: true,
      delInput: true,
      list: true,
    };
  }
}

export class Input {
  constructor(shape, value, menu) {
    this.shape = shape;
    this.value = value;
    this.menu = menu || null;

    this.isBoolean = shape === "boolean";
    this.isStack = shape === "stack";
    this.isColor = shape === "color";
  }
  get isInput() {
    return true;
  }
}

export class Block {
  constructor(info, children, comment) {
    assert(info);
    this.info = { ...info };
    this.children = children;
    this.comment = comment || null;
    this.diff = null;

    const shape = this.info.shape;
    this.isHat = shape === "hat" || shape === "cat" || shape === "define-hat";
    this.isFinal = /cap/.test(shape);
    this.isCommand = shape === "stack" || shape === "cap" || /block/.test(shape);
    this.isOutline = shape === "outline";
    this.isReporter = shape === "reporter";
    this.isBoolean = shape === "boolean";

    this.isRing = shape === "ring";
    this.hasScript = /block/.test(shape);
    this.isElse = shape === "celse";
    this.isEnd = shape === "cend";
  }
  get isBlock() {
    return true;
  }
  get parameters() {
    return getSortedParameters(this.children, this.info.id, this.info.language);
  }
}

export class Comment {
  constructor(value, hasBlock) {
    this.label = new Label(value, "comment-label");
    this.hasBlock = hasBlock;
  }
  get isComment() {
    return true;
  }
}

export class Script {
  constructor(blocks) {
    this.blocks = blocks;
    this.isEmpty = !blocks.length;
    this.isFinal = !this.isEmpty && blocks[blocks.length - 1].isFinal;
  }
  get isScript() {
    return true;
  }
}

export class Document {
  constructor(scripts) {
    this.scripts = scripts;
  }
}
