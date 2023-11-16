export function shiftDecimalPointToRight(number, times) {
  let num = number.toString();
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
}

export function shiftDecimalPointToLeft(number, times) {
  let num = number.toString();
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
}
