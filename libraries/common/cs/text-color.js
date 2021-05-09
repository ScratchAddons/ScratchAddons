function parseHex(hex) {
  return {
    r: parseInt(hex.substring(1, 3), 16),
    g: parseInt(hex.substring(3, 5), 16),
    b: parseInt(hex.substring(5, 7), 16),
    a: hex.length >= 9 ? parseInt(hex.substring(7, 9), 16) / 255 : 1,
  };
}

function convertComponentToHex(a) {
  a = Math.round(a).toString(16);
  if (a.length === 1) return `0${a}`;
  return a;
}

function convertToHex(obj) {
  const r = convertComponentToHex(obj.r);
  const g = convertComponentToHex(obj.g);
  const b = convertComponentToHex(obj.b);
  const a = obj.a !== undefined ? convertComponentToHex(255 * obj.a) : "";
  return `#${r}${g}${b}${a}`;
}

function textColor(hex, black, white, threshold) {
  const { r, g, b } = parseHex(hex);
  threshold = threshold !== undefined ? threshold : 170;
  if (r * 0.299 + g * 0.587 + b * 0.114 > threshold) {
    // https://stackoverflow.com/a/3943023
    return black !== undefined ? black : "#575e75";
  } else {
    return white !== undefined ? white : "#ffffff";
  }
}

function multiply(hex, c) {
  const { r, g, b, a } = parseHex(hex);
  if (c.r === undefined) c.r = 1;
  if (c.g === undefined) c.g = 1;
  if (c.b === undefined) c.b = 1;
  if (c.a === undefined) c.a = 1;
  return convertToHex({ r: c.r * r, g: c.g * g, b: c.b * b, a: c.a * a });
}

function brighten(hex, c) {
  const { r, g, b, a } = parseHex(hex);
  if (c.r === undefined) c.r = 1;
  if (c.g === undefined) c.g = 1;
  if (c.b === undefined) c.b = 1;
  if (c.a === undefined) c.a = 1;
  return convertToHex({
    r: (1 - c.r) * 255 + c.r * r,
    g: (1 - c.g) * 255 + c.g * g,
    b: (1 - c.b) * 255 + c.b * b,
    a: (1 - c.a) * 255 + c.a * a,
  });
}

globalThis.__scratchAddonsTextColor = {
  textColor,
  multiply,
  brighten,
};
