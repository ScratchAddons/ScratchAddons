function parseHex(hex) {
  return {
    r: parseInt(hex.substring(1, 3), 16),
    g: parseInt(hex.substring(3, 5), 16),
    b: parseInt(hex.substring(5, 7), 16),
  };
}

function setCSSVar(name, value) {
  document.documentElement.style.setProperty(`--editorDarkMode-${name}`, value);
}

function textColor(varName, hex, black, white, threshold) {
  const { r, g, b } = parseHex(hex);
  threshold = threshold !== undefined ? threshold : 170;
  if (r * 0.299 + g * 0.587 + b * 0.114 > threshold) {
    // https://stackoverflow.com/a/3943023
    setCSSVar(varName, black !== undefined ? black : "#575e75");
  } else {
    setCSSVar(varName, white !== undefined ? white : "#ffffff");
  }
}

function transparentVariant(varName, hex, opacity) {
  const { r, g, b } = parseHex(hex);
  setCSSVar(varName, `rgba(${r}, ${g}, ${b}, ${opacity})`);
}

function lightDarkVariant(varName, hex, threshold, cr, cg, cb, lr, lg, lb) {
  const { r, g, b } = parseHex(hex);
  if (lr === undefined) lr = cr;
  if (lg === undefined) lg = cg;
  if (lb === undefined) lb = cb;
  textColor(
    varName,
    hex,
    `rgb(${cr * r}, ${cg * g}, ${cb * b})`,
    `rgb(${(1 - lr) * 255 + lr * r}, ${(1 - lg) * 255 + lg * g}, ${(1 - lb) * 255 + lb * b})`,
    threshold
  );
}

function testAll(settings) {
  for (let setting of [
    "page",
    "primary",
    "menuBar",
    "selector",
    "selector2",
    "selectorSelection",
    "accent",
    "input",
    "categoryMenu",
    "palette",
  ]) {
    textColor(`${setting}-text`, settings.get(setting));
  }
  textColor("page-tabHoverFilter", settings.get("page"), "grayscale(100%)", "brightness(0) invert(1)");
  textColor("primary-filter", settings.get("primary"), "brightness(0.4)", "none");
  textColor("primary-filter2", settings.get("primary"), "none", "brightness(0) invert(1)");
  textColor("menuBar-transparentText", settings.get("menuBar"), "rgba(87, 94, 177, 0.25)", "rgba(255, 255, 255, 0.25)");
  textColor("menuBar-dimText", settings.get("menuBar"), "rgba(87, 94, 177, 0.75)", "rgba(255, 255, 255, 0.75)");
  textColor("menuBar-filter", settings.get("menuBar"), "brightness(0.4)", "none");
  textColor("menuBar-border", settings.get("menuBar"), "rgba(0, 0, 0, 0.15)", "rgba(255, 255, 255, 0.15)", 60);
  textColor("tab-text", settings.get("tab"), "rgba(87, 94, 117, 0.75)", "rgba(255, 255, 255, 0.75)");
  textColor("selector2-filter", settings.get("selector2"), "none", "brightness(0) invert(1)");
  textColor("accent-filter", settings.get("accent"), "none", "brightness(0) invert(1)");
  textColor("accent-desaturateFilter", settings.get("accent"), "saturate(0)", "brightness(0) invert(1) opacity(0.7)");
  textColor("input-transparentText", settings.get("input"), "rgba(87, 94, 117, 0.6)", "rgba(255, 255, 255, 0.4)");
  textColor("input-filter", settings.get("input"), "none", "brightness(0) invert(1)");
  textColor("workspace-codeZoomFilter", settings.get("workspace"), "none", "invert(1) hue-rotate(180deg)");
  textColor(
    "categoryMenu-selection",
    settings.get("categoryMenu"),
    "rgba(87, 124, 155, 0.13)",
    "rgba(255, 255, 255, 0.05)"
  );
  textColor("palette-filter", settings.get("palette"), "none", "brightness(0) invert(1)");
  transparentVariant("primary-transparent35", settings.get("primary"), "0.35");
  transparentVariant("primary-transparent25", settings.get("primary"), "0.25");
  transparentVariant("primary-transparent20", settings.get("primary"), "0.2");
  transparentVariant("primary-transparent15", settings.get("primary"), "0.15");
  transparentVariant("primary-overlay", settings.get("primary"), "0.9");
  transparentVariant("accent-opacity0", settings.get("accent"), "0");
  transparentVariant("input-transparent50", settings.get("input"), "0.5");
  transparentVariant("input-transparent25", settings.get("input"), "0.25");
  lightDarkVariant("primary-variant", settings.get("primary"), 60, 0.67, 0.76, 0.8);
  lightDarkVariant("workspace-scrollbar", settings.get("workspace"), 170, 0.83, 0.83, 0.83, 0.87, 0.87, 0.87);
  lightDarkVariant("palette-scrollbar", settings.get("palette"), 170, 0.83, 0.83, 0.83, 0.92, 0.92, 0.92);
  if (settings.get("dots")) {
    textColor("workspace-dots", settings.get("workspace"), "rgba(0, 0, 0, 0.13)", "rgba(255, 255, 255, 0.13)");
  } else {
    document.documentElement.style.setProperty("--editorDarkMode-workspace-dots", "none");
  }
}

export default async function ({ addon, console }) {
  testAll(addon.settings);
  addon.settings.addEventListener("change", function () {
    testAll(addon.settings);
  });
}
