export default async function ({ addon }) {
  const settings = {
    none: 0,
    tenth: 0.1,
    one: 1,
    ten: 10,
  };

  const amountOfDecimals = (num) => {
    if (num % 1 === 0) return 0;
    return num.toString().split(".")[1].length;
  };

  const shiftDecimalPointToRight = (num, times) => {
    const numberIsNegative = num[0] === "-";
    let numStr = num.toString();
    if (numberIsNegative) numStr = numStr.substring(1);
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
    return Number(numStr) * (numberIsNegative ? -1 : 1);
  };

  document.body.addEventListener("keydown", (e) => {
    if (!e.target.classList.contains("blocklyHtmlInput")) return;
    if (!["ArrowUp", "ArrowDown"].includes(e.code)) return;
    if (
      e.target.value &&
      Number(e.target.value)
        .toString()
        .replace(/^0*|0*$/, "") !== e.target.value.replace(/^0*|0*$/, "")
    )
      return;

    if (e.target.value.length > 10) return;
    const currentValue = Number(e.target.value);
    if (amountOfDecimals(currentValue) > 5) return;

    e.preventDefault();

    const changeBy =
      (e.shiftKey
        ? settings[addon.settings.get("shift")]
        : e.altKey
        ? settings[addon.settings.get("alt")]
        : settings[addon.settings.get("regular")]) * (e.code === "ArrowUp" ? 1 : -1);

    const newValueAsInt = shiftDecimalPointToRight(currentValue, 5) + shiftDecimalPointToRight(changeBy, 5);
    const newValueAsArr = Array.from(newValueAsInt.toString());

    newValueAsArr.splice(newValueAsArr.length - 5, 0, ".");
    let newValueNumber = newValueAsArr.join("").replace(/0*$/, "");
    if (newValueNumber.startsWith(".")) newValueNumber = "0" + newValueNumber;
    else if (newValueNumber.startsWith("-.")) newValueNumber = "-0" + newValueNumber.substring(1);
    if (newValueNumber.endsWith(".")) newValueNumber = newValueNumber.slice(0, -1);

    e.target.value = newValueNumber;
  });
}
