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

function convertFromHsv({ h, s, v }) {
  if (s === 0) return { r: 255 * v, g: 255 * v, b: 255 * v };
  h %= 360;
  if (h < 0) h += 360;
  const h1 = h / 60;
  const hi = Math.floor(h1);
  const x = v * (1 - s * (1 - h1 + hi));
  const y = v * (1 - s * (h1 - hi));
  const z = v * (1 - s);
  switch (hi) {
    case 0:
      return { r: 255 * v, g: 255 * x, b: 255 * z };
    case 1:
      return { r: 255 * y, g: 255 * v, b: 255 * z };
    case 2:
      return { r: 255 * z, g: 255 * v, b: 255 * x };
    case 3:
      return { r: 255 * z, g: 255 * y, b: 255 * v };
    case 4:
      return { r: 255 * x, g: 255 * z, b: 255 * v };
    case 5:
      return { r: 255 * v, g: 255 * z, b: 255 * y };
  }
}

function convertToHsv({ r, g, b }) {
  r /= 255;
  g /= 255;
  b /= 255;
  const v = Math.max(r, g, b);
  const d = v - Math.min(r, g, b);
  if (d === 0) return { h: 0, s: 0, v: v }; // gray
  const s = d / v;
  const hr = (v - r) / d;
  const hg = (v - g) / d;
  const hb = (v - b) / d;
  let h1;
  if (!hr) h1 = hb - hg;
  else if (!hg) h1 = 2 + hr - hb;
  else if (!hb) h1 = 4 + hg - hr;
  const h = (60 * h1) % 360;
  return { h, s, v };
}

function brightness(hex) {
  const { r, g, b } = parseHex(hex);
  return r * 0.299 + g * 0.587 + b * 0.114;
}

function textColor(hex, black, white, threshold) {
  threshold = threshold !== undefined ? threshold : 170;
  if (typeof threshold !== "number") threshold = brightness(threshold);
  if (brightness(hex) > threshold) {
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
    a: 1 - c.a + c.a * a,
  });
}

function alphaBlend(opaqueHex, transparentHex) {
  const { r: r1, g: g1, b: b1 } = parseHex(opaqueHex);
  const { r: r2, g: g2, b: b2, a } = parseHex(transparentHex);
  return convertToHex({
    r: (1 - a) * r1 + a * r2,
    g: (1 - a) * g1 + a * g2,
    b: (1 - a) * b1 + a * b2,
  });
}

function removeAlpha(hex) {
  return hex.substring(0, 7);
}

function makeHsv(hSource, sSource, vSource) {
  const h = typeof hSource === "number" ? hSource : convertToHsv(parseHex(hSource)).h;
  const s =
    typeof hSource !== "number" && convertToHsv(parseHex(hSource)).s === 0
      ? 0
      : typeof sSource === "number"
        ? sSource
        : convertToHsv(parseHex(sSource)).s;
  const v = typeof vSource === "number" ? vSource : convertToHsv(parseHex(vSource)).v;
  return convertToHex(convertFromHsv({ h, s, v }));
}

function recolorFilter(hex) {
  const { r, g, b } = parseHex(hex);
  return `url("data:image/svg+xml,
    <svg xmlns='http://www.w3.org/2000/svg'>
      <filter id='recolor'>
        <feColorMatrix color-interpolation-filters='sRGB' values='
          0 0 0 0 ${r / 255}
          0 0 0 0 ${g / 255}
          0 0 0 0 ${b / 255}
          0 0 0 1 0
        '/>
      </filter>
    </svg>#recolor
  ")`
    .split("\n")
    .join("");
}

globalThis.__scratchAddonsTextColor = {
  parseHex,
  convertToHex,
  convertFromHsv,
  convertToHsv,
  brightness,
  textColor,
  multiply,
  brighten,
  alphaBlend,
  removeAlpha,
  makeHsv,
  recolorFilter,
};
