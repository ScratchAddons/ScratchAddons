export default async function ({ addon }) {
  function getRegexFromSettings() {
    let textInInputs = addon.settings.get("textInInputs");
    return textInInputs ? /^.*$/i : /^[0-9+\-*^/(). ]+$/;
  }
  var loseFocus;
  const checkElForTypeChange = (el) => {
    // These inputs need their type changed
    loseFocus = false;
    let type = " input[type=number]";
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
        loseFocus = true;
        return true;
      }
      // Doing math in the following inputs is almost useless, but for consistency we'll allow it
    } else if (el.matches("[class*=sa-paint-snap-settings]" + type)) {
      // The paint-snap distance setting
      loseFocus = true;
      return true;
    } else if (el.matches("[class*=sa-onion-settings]" + type)) {
      // All inputs in the onion-skinning settings
      loseFocus = true;
      return true;
    }
    return false;
  };

  // And this is stolen from SO, I love not having to code stuff
  let parens = /\(([0-9+\-*/\^ .]+)\)/; // Regex for identifying parenthetical expressions
  let exp = /(\d+(?:\.\d+)?) *\^ *(\d+(?:\.\d+)?)/; // Regex for identifying exponentials (x ^ y)
  let expAlt = /(\d+(?:\.\d+)?) *\*\* *(\d+(?:\.\d+)?)/; //Regex for identifying **
  let mul = /(\d+(?:\.\d+)?) *\* *(\d+(?:\.\d+)?)/; // Regex for identifying multiplication (x * y)
  let div = /(\d+(?:\.\d+)?) *\/ *(\d+(?:\.\d+)?)/; // Regex for identifying division (x / y)
  let add = /(\d+(?:\.\d+)?) *\+ *(\d+(?:\.\d+)?)/; // Regex for identifying addition (x + y)
  let sub = /(\d+(?:\.\d+)?) *- *(\d+(?:\.\d+)?)/; // Regex for identifying subtraction (x - y)

  /**
   * Evaluates a numerical expression as a string and returns a Number
   * Follows standard PEMDAS operation ordering
   * @param {String} expr Numerical expression input
   * @returns {Number} Result of expression
   */
  function evaluate(expr) {
    if (isNaN(Number(expr))) {
      if (parens.test(expr)) {
        let newExpr = expr.replace(parens, function (match, subExpr) {
          return evaluate(subExpr);
        });
        return evaluate(newExpr);
      } else if (exp.test(expr)) {
        let newExpr = expr.replace(exp, function (match, base, pow) {
          return Math.pow(Number(base), Number(pow));
        });
        return evaluate(newExpr);
      } else if (expAlt.test(expr)) {
        let newExpr = expr.replace(expAlt, function (match, base, pow) {
          return Math.pow(Number(base), Number(pow));
        });
        return evaluate(newExpr);
      } else if (mul.test(expr)) {
        let newExpr = expr.replace(mul, function (match, a, b) {
          return Number(a) * Number(b);
        });
        return evaluate(newExpr);
      } else if (div.test(expr)) {
        let newExpr = expr.replace(div, function (match, a, b) {
          return Number(a) / Number(b);
        });
        return evaluate(newExpr);
      } else if (add.test(expr)) {
        let newExpr = expr.replace(add, function (match, a, b) {
          return Number(a) + Number(b);
        });
        return evaluate(newExpr);
      } else if (sub.test(expr)) {
        let newExpr = expr.replace(sub, function (match, a, b) {
          return Number(a) - Number(b);
        });
        return evaluate(newExpr);
      } else {
        return expr;
      }
    }
    return Number(expr);
  }

  function parseMath(value) {
    if (!/^[0-9+\-*/().^ ]+$/.test(value)) {
      return value;
    }
    return evaluate(value);
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
    if (checkElForTypeChange(target)) {
      target.type = "text";
      const inputLength = target.value?.length ?? 0;
      target.setSelectionRange(inputLength, inputLength);
    }
  });

  document.body.addEventListener("focusout", function (event) {
    const target = event.target;
    if (checkElForTypeChange(target)) {
      target.type = "number";
    }
  });
}
