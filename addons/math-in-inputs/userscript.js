export default async function ({ addon }) {
  function getRegexFromSettings() {
    let textInInputs = addon.settings.get("textInInputs");
    return textInInputs ? /^[0-9a-z+\-*^/().]+$/ : /^[0-9+\-*^/().]+$/;
  }

  /* I 100% stole this part of the code from "editor-number-arrow-keys"
     Right now it only works for the sprite properties because those are the only ones that actually
     allow the operators to be typed into them, not sure how to get around this :( */
  const isSupportedElement = (el) => {
    if (el.classList.contains("blocklyHtmlInput")) return true;
    else if (el.matches(".mediaRecorderPopupContent input[type=number]")) {
      // Number inputs in `mediarecorder` addon modal
      return true;
    } else if (el.className.includes("input_input-form_")) {
      if (el.matches("[class*=sprite-info_sprite-info_] [class*=input_input-small_]")) {
      }
      // Sprite X/Y coordinates, size and direction (excludes sprite name)
      return true;
    } else if (el.matches("[class*=paint-editor_editor-container-top_] input[type=number]")) {
      // Number inputs in costume editor (note that browsers already provide up/down clickable buttons for these)
      return true;
    } else return false;
  };

  function power(match, x, y) {
    return `Math.pow(${x}, ${y})`;
  }

  function parseMath(value) {
    if (!/^[0-9+\-*/().^]+$/.test(value)) {
      return value;
    }

    const processedValue = value.replace(/(\d+)\^(\d+)/g, power);

    try {
      return eval(processedValue) || 0;
    } catch (error) {
      return 0;
    }
  }

  // #Garboism
  const ScratchBlocks = await addon.tab.traps.getBlockly();
  var original = ScratchBlocks.FieldNumber.prototype.onHtmlInputKeyDown_;
  ScratchBlocks.FieldNumber.prototype.onHtmlInputKeyDown_ = function (...args) {
    this.restrictor_ = getRegexFromSettings();
    return original.apply(this, args);
  };
  function handleParseInput(e) {
    if (addon.self.disabled) return;
    if (!isSupportedElement(e.target)) return;
    if (!e.target.value) return;
    const newValue = parseMath(e.target.value);
    Object.getOwnPropertyDescriptor(e.target.constructor.prototype, "value").set.call(e.target, newValue.toString());
    e.target.dispatchEvent(new Event("input", { bubbles: true }));
  }
  document.body.addEventListener(
    "keydown",
    (e) => {
      if (e.key !== "Enter") return;
      handleParseInput(e);
    },
    { capture: true }
  );
  document.body.addEventListener(
    "blur",
    (e) => {
      handleParseInput(e);
    },
    { capture: true }
  );
}
