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
    return BigInt(numStr) * (isNumberNegative ? -1n : 1n);
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

    // Adds zero before the decimal point if necessary (.1 → 0.1)
    if (numStr[0] === ".") {
      numStr = "0" + numStr;
    }

    // Removes trailing zeros (2.250 → 2.25)
    if (numStr.includes(".")) {
      numStr = numStr.replace(/0*$/, "");
    }

    // Removes the decimal point if it's the last character (2. → 2)
    if (numStr.endsWith(".")) {
      numStr = numStr.slice(0, -1);
    }

    return numStr ? (isNumberNegative ? "-" : "") + numStr : 0;
  };

  const isValidNumber = (numStr) => {
    if (numStr.length > 30) return false;
    try {
      BigInt(numStr.replace(".", ""));
    } catch {
      return false; // Even though an error would occur later anyway, we still catch now to abort before e.preventDefault().
    }
    return true;
  };

  // Because math-in-inputs changes the type to "text", we need to check for that instead of "number"
  const isSupportedElement = (el) => {
    let inputSelector = " input:is([type=text], [type=number])";
    if (!el.classList) return false;
    if (el.classList.contains("blocklyHtmlInput")) return true; // Block inputs do not have a type to change
    else if (el.matches("[class*=mediaRecorderPopupContent]" + inputSelector)) {
      // Number inputs in `mediarecorder` addon modal
      return true;
    } else if (el.matches("[class*=input_input-form_]")) {
      // The following elements have this in their class list
      if (el.matches("[class*=input_input-small_]")) {
        // Inputs in sprite propeties (exluding sprite name)
        return true;
      } else if (
        el.matches("[class*=paint-editor_editor-container-top_]" + inputSelector) &&
        !el.matches("[class*=fixed-tools_costume-input_]")
      ) {
        // All costume editor inputs (in the top bar: outline width, brush size, etc) except costume name
        return true;
      } else if (el.matches("[class*=Popover-body]" + inputSelector)) {
        // Any inputs in the colour popover
        return true;
      }
      // Doing math in the following inputs is almost useless, but for consistency we'll allow it
    } else if (el.matches("[class*=sa-paint-snap-settings]" + inputSelector)) {
      // The paint-snap distance setting
      return true;
    } else if (el.matches("[class*=sa-onion-settings]" + inputSelector)) {
      // All inputs in the onion-skinning settings
      return true;
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

    const decimalCount = Math.max(amountOfDecimals(e.target.value), amountOfDecimals(changeBy.toString()));
    const newValueAsBigInt =
      shiftDecimalPointToRight(e.target.value, decimalCount) +
      shiftDecimalPointToRight(changeBy.toString(), decimalCount);
    const newValue = shiftDecimalPointToLeft(newValueAsBigInt.toString(), decimalCount);

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
      e.target.dispatchEvent(new Event("input"));
    }
  });
}
