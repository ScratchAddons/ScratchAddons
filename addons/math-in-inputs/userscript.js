export default async function ({ addon, console }) {
  const script = document.createElement("script");
  script.src = `${addon.self.lib}/thirdparty/cs/eval-expr.min.js`;
  document.head.appendChild(script);

  function getRegexFromSettings() {
    let textInInputs = addon.settings.get("textInInputs");
    return textInInputs ? /^.*$/i : /^[0-9+\-*^/()!%. ]+$/;
  }
  const checkElForTypeChange = (el, focus) => {
    // These inputs need their type changed
    let type = focus === "in" ? " input[type=number]" : " input[type=text]";
    if (!el.classList) return false;
    if (el.matches("[class*=mediaRecorderPopupContent]" + type)) {
      // Number inputs in `mediarecorder` addon modal
      return true;
    } else if (el.matches("[class*=input_input-form_]")) {
      if (
        el.matches("[class*=paint-editor_editor-container-top_]" + type) &&
        !el.matches("[class*=fixed-tools_costume-input_]")
      ) {
        // All costume editor inputs (in the top bar: outline width, brush size, etc) except costume name
        return true;
      } else if (el.matches("[class*=Popover-body]" + type)) {
        // Any inputs in the colour popover
        return true;
      }
      // Doing math in the following inputs is almost useless, but for consistency we'll allow it
    } else if (el.matches("[class*=sa-paint-snap-settings]" + type)) {
      // The paint-snap distance setting
      return true;
    } else if (el.matches("[class*=sa-onion-settings]" + type)) {
      // All inputs in the onion-skinning settings
      return true;
    }
    return false;
  };

  let parser;
  script.onload = function () {
    parser = new window.exprEval.Parser({
      operators: {
        // These default to true, but are included to be explicit
        add: true,
        concatenate: false,
        conditional: false,
        divide: true,
        factorial: true,
        multiply: true,
        power: true,
        remainder: true,
        subtract: true,

        // Disable and, or, not, <, ==, !=, etc.
        logical: false,
        comparison: false,

        // Disable 'in' and = operators
        in: false,
        assignment: false,
      },
    });
  };

  function parseMath(value) {
    let expr = parser.parse(value);
    return expr.evaluate();
  }

  // #Garboism
  const ScratchBlocks = await addon.tab.traps.getBlockly();
  var original = ScratchBlocks.FieldNumber.prototype.onHtmlInputKeyDown_;
  ScratchBlocks.FieldNumber.prototype.onHtmlInputKeyDown_ = function (...args) {
    if (!addon.self.disabled) this.restrictor_ = getRegexFromSettings();
    return original.apply(this, args);
  };

  function handleParseInput(e) {
    if (addon.self.disabled) return;
    if (!e.target.value) return;
    const newValue = parseMath(e.target.value);
    Object.getOwnPropertyDescriptor(e.target.constructor.prototype, "value").set.call(e.target, newValue.toString());

    var inputEvent = new InputEvent("input", {
      bubbles: true,
      cancelable: true,
    });

    e.target.dispatchEvent(inputEvent);
    e.target.blur();
  }
  document.addEventListener(
    "keydown",
    (e) => {
      if (addon.self.disabled) return;
      if ((e.code === "Enter" || e.code === "NumpadEnter") && (e.ctrlKey || e.metaKey)) {
        handleParseInput(e);
      }
    },
    true
  );

  document.body.addEventListener("focusin", function (event) {
    const target = event.target;
    if (checkElForTypeChange(target, "in")) {
      target.type = "text";
      const inputLength = target.value?.length ?? 0;
      target.setSelectionRange(inputLength, inputLength);
    }
  });

  document.body.addEventListener("focusout", function (event) {
    const target = event.target;
    if (checkElForTypeChange(target, "out")) {
      target.type = "number";
    }
  });
}
