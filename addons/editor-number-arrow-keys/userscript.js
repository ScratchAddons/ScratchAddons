export default async function ({ addon }) {
  const settings = {
    none: 0,
    hundredth: 0.01,
    tenth: 0.1,
    one: 1,
    ten: 10,
  };

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

  document.body.addEventListener("keydown", (e) => {
    if (addon.self.disabled) return;
    if (!e.target.classList.contains("blocklyHtmlInput")) return;
    if (!["ArrowUp", "ArrowDown"].includes(e.code)) return;
    if (!e.target.value) return;
    if (!isValidNumber(e.target.value)) return;

    e.preventDefault();

    const changeBy =
      (e.shiftKey
        ? settings[addon.settings.get("shift")]
        : e.altKey
          ? settings[addon.settings.get("alt")]
          : settings[addon.settings.get("regular")]) * (e.code === "ArrowUp" ? 1 : -1);

    const newValueAsInt =
      shiftDecimalPointToRight(e.target.value, 5) + shiftDecimalPointToRight(changeBy.toString(), 5);
    const newValue = shiftDecimalPointToLeft(newValueAsInt.toString(), 5);

    e.target.value = newValue.toString();
  });
}
