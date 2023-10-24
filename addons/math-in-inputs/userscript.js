export default async function ({ addon }) {
  function getRegexFromSettings() {
    let textInInputs = addon.settings.get("textInInputs");
    return textInInputs ? /^.*$/i : /^[0-9+\-*^/(). ]+$/;
  }
  var loseFocus;
  // I 100% stole this part of the code from "editor-number-arrow-keys"
  const isSupportedElement = (el, forChangingType) => {
    loseFocus = false;
    let type = forChangingType ? " input[type=number]" : " input[type=text]";
    if (!el.classList) return false;
    if (el.classList.contains("blocklyHtmlInput") && !forChangingType)
      return true; // Block inputs do not have a type to change
    else if (el.matches("[class*=mediaRecorderPopupContent]" + type)) {
      // Number inputs in `mediarecorder` addon modal
      return true;
    } else if (el.matches("[class*=input_input-form_]")) {
      // The following elements have this in their class list
      if (el.matches("[class*=sprit-info_sprite-info_] [class*=input_input-small_]") && !forChangingType) {
        // Inputs in sprite propeties (exluding sprite name) (type does not need to be changed)
        return true;
      } else if (el.matches("[class*=paint-editor_editor-container-top_]" + type)) {
        // All costume editor inputs (in the top bar: outline width, brush size, etc)
        return true;
      } else if (el.matches("[class*=Popover-body]" + type)) {
        // Any inputs in the colour popover
        loseFocus = true;
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

  function handleParseInput(e, ctrl) {
    if (addon.self.disabled) return;
    if (!isSupportedElement(e.target) && !ctrl) return;
    if (!e.target.value) return;
    const newValue = parseMath(e.target.value);
    Object.getOwnPropertyDescriptor(e.target.constructor.prototype, "value").set.call(e.target, newValue.toString());
    if (loseFocus) e.target.blur();
  }
  document.addEventListener(
    "keydown",
    (e) => {
      if (addon.self.disabled) return;
      if (e.code === "Enter" || e.code === "NumpadEnter") {
        // Force math in ANY input if you hold ctrl
        let ctrlKeyDown = e.ctrlKey || e.metaKey;
        handleParseInput(e, ctrlKeyDown);
      }
    },
    true
  );
  document.addEventListener(
    "change",
    (e) => {
      if (addon.self.disabled) return;
      handleParseInput(e);
    },
    true
  );

  function handleInputTypeChanges(input) {
    if (input) {
      input.addEventListener("focusin", function () {
        input.type = "text";
        const inputLength = input.value?.length ?? 0;
        input.setSelectionRange(inputLength, inputLength); // Set cursor position to the end of the input
      });

      input.addEventListener("focusout", function () {
        input.type = "number";
      });
    }
  }

  function traverseAndHandleElements(node) {
    if (isSupportedElement(node, true)) {
      handleInputTypeChanges(node);
    }

    node.childNodes.forEach((child) => {
      traverseAndHandleElements(child);
    });
  }

  var observer = new MutationObserver(function (mutationsList) {
    mutationsList.forEach(function (mutation) {
      if (mutation.addedNodes && mutation.addedNodes.length > 0) {
        mutation.addedNodes.forEach(function (el) {
          // Start the recursive traversal from the newly added element
          traverseAndHandleElements(el);
        });
      }
    });
  }, true);

  const observerConfig = { childList: true, subtree: true };
  observer.observe(document.body, observerConfig);
}
