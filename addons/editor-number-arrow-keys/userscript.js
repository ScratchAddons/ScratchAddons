export default async function ({ addon }) {
  const settings = {
    none: 0,
    hundredth: 0.01,
    tenth: 0.1,
    one: 1,
    ten: 10,
  };
  const inputMap = new WeakMap();

  const amountOfDecimals = (numStr) => {
    if (!numStr.includes(".")) return 0;
    return numStr.toString().split(".")[1].length;
  };

  const shiftDecimalPointToRight = (num, times) => {
    const isNumberNegative = num[0] === "-";
    let numStr = isNumberNegative ? num.substring(1) : num;
    for (let i = 0; i < times; i++) {
      if (numStr.indexOf(".") === -1) numStr += 0;
      else if (numStr.indexOf(".") === numStr.length - 2) numStr = numStr.replace(".", "");
      else {
        const index = numStr.indexOf(".");
        const numArrFiltered = Array.from(numStr.replace(".", ""));
        numArrFiltered.splice(index + 1, 0, ".");
        numStr = numArrFiltered.join("");
      }
    }
    return Number(numStr) * (isNumberNegative ? -1 : 1);
  };
  const shiftDecimalPointToLeft = (num, times) => {
    const isNumberNegative = num[0] === "-";
    let numStr = isNumberNegative ? num.substring(1) : num;
    for (let i = 0; i < times; i++) {
      if (numStr.indexOf(".") === 0) numStr = ".0" + numStr.substring(1);
      else if (numStr.indexOf(".") === -1) {
        const numArr = Array.from(numStr);
        numArr.splice(numArr.length - 1, 0, ".");
        numStr = numArr.join("");
      } else {
        const index = numStr.indexOf(".");
        const numArrFiltered = Array.from(numStr.replace(".", ""));
        numArrFiltered.splice(index - 1, 0, ".");
        numStr = numArrFiltered.join("");
      }
    }
    return Number(numStr) * (isNumberNegative ? -1 : 1);
  };

  const normalizeNumber = (numStr) => {
    const isNumberNegative = numStr[0] === "-";
    const numStrPositive = isNumberNegative ? numStr.substring(1) : numStr;

    let normalizedNum = numStrPositive;

    // Adds zero before the decimal point if necessary (.1 → 0.1)
    if (normalizedNum[0] === ".") {
      normalizedNum = "0" + normalizedNum;
    }

    // Removes leading zeros (02.25 → 2.25)
    if (/^0*$/.test(numStrPositive.split(".")[0])) {
      // Case where integerPart = (0 or 00 or 000, etc...)
      const decimalPart = numStrPositive.split(".")[1] || "";
      normalizedNum = `0.${decimalPart}`;
    } else {
      normalizedNum = normalizedNum.replace(/^0*|0*$/, "");
    }

    // Removes trailing zeros (2.250 → 2.25)
    if (numStrPositive.includes(".")) {
      normalizedNum = normalizedNum.replace(/0*$/, "");
    }

    // Removes the decimal point if it's the last character (2. → 2)
    if (normalizedNum.endsWith(".")) {
      normalizedNum = normalizedNum.slice(0, -1);
    }

    return (isNumberNegative ? "-" : "") + normalizedNum;
  };

  const isValidNumber = (numStr) => {
    if (numStr.length > 10) return false;
    if (amountOfDecimals(numStr) > 5) return false;
    return normalizeNumber(numStr) === Number(numStr).toString();
  };

  const isSupportedElement = (el) => {
    if (el.classList.contains("blocklyHtmlInput")) return true;
    else if (el.matches(".mediaRecorderPopupContent input[type=number]")) {
      // Number inputs in `mediarecorder` addon modal
      return true;
    } else if (el.className.includes("input_input-form_")) {
      if (el.matches("[class*=sprite-info_sprite-info_] [class*=input_input-small_]")) {
        // Sprite X/Y coordinates, size and direction (excludes sprite name)
        return true;
      } else if (el.matches("[class*=paint-editor_editor-container-top_] input[type=number]")) {
        // Number inputs in costume editor (note that browsers already provide up/down clickable buttons for these)
        return true;
      } else return false;
    }
    return false;
  };

  document.body.addEventListener("keydown", (e) => {
    if (addon.self.disabled) return;
    if (!["ArrowUp", "ArrowDown"].includes(e.key)) return;
    if (!isSupportedElement(e.target)) return;
    if (!e.target.value) return;
    if (!isValidNumber(e.target.value)) return;

    e.preventDefault();
    // If this is a text input, this will prevent the cursor from moving to the beginning/end of the input.
    // If this is a number input, it will prevent the default browser behavior when pressing up/down in a
    // number input (increase or decrease by 1). If we didn't prevent, the user would be increasing twice.

    let changeBy = e.key === "ArrowUp" ? 1 : -1;
    if (addon.settings.get("useCustom")) {
      let settingValue = e.shiftKey
        ? addon.settings.get("shiftCustom")
        : e.altKey
          ? addon.settings.get("altCustom")
          : addon.settings.get("regularCustom");
      if (settingValue === "") settingValue = 0;
      let valueAsFloat = parseFloat(settingValue);
      if (valueAsFloat < 0) valueAsFloat *= -1; // If user typed a negative number, we make it positive
      if (Number.isNaN(valueAsFloat)) {
        return;
      } else if (valueAsFloat === 0 || (valueAsFloat < 100000000 && valueAsFloat > 0.00000099)) {
        // This will exclude valid floats such as `1e20` that are less than 9 characters
        changeBy *= valueAsFloat;
      } else {
        return;
      }
    } else {
      changeBy *= e.shiftKey
        ? settings[addon.settings.get("shift")]
        : e.altKey
          ? settings[addon.settings.get("alt")]
          : settings[addon.settings.get("regular")];
    }

    const newValueAsInt =
      shiftDecimalPointToRight(e.target.value, 5) + shiftDecimalPointToRight(changeBy.toString(), 5);
    const newValue = shiftDecimalPointToLeft(newValueAsInt.toString(), 5);

    if (e.target.className.includes("input_input-form_")) {
      Object.getOwnPropertyDescriptor(e.target.constructor.prototype, "value").set.call(e.target, newValue.toString());
      e.target.dispatchEvent(new Event("input", { bubbles: true }));

      // The user probably wants to visualize how the sprite changes size, coordinates, direction, etc.
      // without having to press Enter. But updating in realtime could be bad for performance.
      const FLUSH_AFTER_MS = 300; // Number of ms to wait until the input change takes effect.
      // Force flush after incrementing/decrementing 5 times in a row, even if it's not been 300ms:
      const FLUSH_AFTER_N_STEPS = 5;

      // https://github.com/scratchfoundation/scratch-gui/blob/develop/src/components/forms/buffered-input-hoc.jsx
      // This function calls handleFlush() on the buffered input when called.
      const flushInput = () => e.target.dispatchEvent(new Event("blur", { bubbles: true }));

      const currentTime = document.timeline.currentTime; // Similar to Date.now() but can't be changed by user unexpectedly
      if (!inputMap.has(e.target)) inputMap.set(e.target, { time: null, steps: -1 });
      inputMap.get(e.target).time = currentTime;
      const newNumOfSteps = (inputMap.get(e.target).steps += 1);

      if (newNumOfSteps === FLUSH_AFTER_N_STEPS) {
        flushInput();
        inputMap.delete(e.target);
      } else {
        setTimeout(() => {
          if (inputMap.get(e.target)?.time === currentTime) {
            flushInput();
            inputMap.delete(e.target);
          }
        }, FLUSH_AFTER_MS);
      }
    } else {
      // Normal Blockly input
      e.target.value = newValue.toString();
    }
  });
}
