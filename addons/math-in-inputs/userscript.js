export default async function ({ addon }) {
  function getRegexFromSettings() {
    let textInInputs = addon.settings.get("textInInputs");
    return textInInputs ? /^.*$/i : /^[0-9+\-*^/(). ]+$/;
  }

  // I 100% stole this part of the code from "editor-number-arrow-keys"
  const isSupportedElement = (el) => {
    if (!el.classList) return false;
    if (el.classList.contains("blocklyHtmlInput")) return true;
    else if (el.matches(".mediaRecorderPopupContent input[type=text]")) {
      // Number inputs in `mediarecorder` addon modal
      // The inputs should be type=text because I change that below to allow math symbols
      return true;
    } else if (el.className.includes("input_input-form_")) {
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
  /**
   *
   * @param {Event} e
   * @returns
   */
  function handleParseInput(e) {
    if (addon.self.disabled) return;
    if (!isSupportedElement(e.target)) return;
    if (!e.target.value) return;
    const newValue = parseMath(e.target.value);
    Object.getOwnPropertyDescriptor(e.target.constructor.prototype, "value").set.call(e.target, newValue.toString());
  }
  document.addEventListener(
    "keydown",
    (e) => {
      if (e.key !== "Enter") return;
      handleParseInput(e);
    },
    true
  );
  document.addEventListener(
    "change",
    (e) => {
      handleParseInput(e);
    },
    true
  );

  function handleInputTypeChanges(input) {
    if (input) {
      input.type = "number";

      input.addEventListener("focusin", function () {
        input.type = "text";
        const inputLength = input.value?.length ?? 0;
        input.setSelectionRange(inputLength, inputLength);
      });

      input.addEventListener("focusout", function () {
        input.type = "number";
      });
    }
  }

  var observer = new MutationObserver(function (mutationsList) {
    mutationsList.forEach(function (mutation) {
      if (mutation.addedNodes && mutation.addedNodes.length > 0) {
        mutation.addedNodes.forEach(function (node) {
          if (
            node instanceof HTMLElement &&
            (node.classList.contains(addon.tab.scratchClass("input-group_input-group")) ||
            node.classList.contains(addon.tab.scratchClass("input_input-form")) ||
            node.matches("input.mediaRecorderPopupContent"))
          ) {
            handleInputTypeChanges(node);
          }
        });
      }
    });
  });

  const observerConfig = { childList: true, subtree: true };
  observer.observe(document.body, observerConfig);
  console.log("MutationObserver started, 231");
}
