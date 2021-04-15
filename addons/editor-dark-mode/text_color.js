import { textColor, multiply, brighten } from "../../libraries/text_color.js";

function setCSSVar(name, value) {
  document.documentElement.style.setProperty(`--editorDarkMode-${name}`, value);
}

function lightDarkVariant(varName, hex, threshold, cr, cg, cb, lr, lg, lb) {
  if (lr === undefined) lr = cr;
  if (lg === undefined) lg = cg;
  if (lb === undefined) lb = cb;
  setCSSVar(
    varName,
    textColor(hex, multiply(hex, { r: cr, g: cg, b: cb }), brighten(hex, { r: lr, g: lg, b: lb }), threshold)
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
    setCSSVar(`${setting}-text`, textColor(settings.get(setting)));
  }
  setCSSVar("page-tabHoverFilter", textColor(settings.get("page"), "grayscale(100%)", "brightness(0) invert(1)"));
  setCSSVar("primary-filter", textColor(settings.get("primary"), "brightness(0.4)", "none"));
  setCSSVar("primary-filter2", textColor(settings.get("primary"), "none", "brightness(0) invert(1)"));
  setCSSVar("primary-transparent35", multiply(settings.get("primary"), { a: 0.35 }));
  setCSSVar("primary-transparent25", multiply(settings.get("primary"), { a: 0.25 }));
  setCSSVar("primary-transparent20", multiply(settings.get("primary"), { a: 0.2 }));
  setCSSVar("primary-transparent15", multiply(settings.get("primary"), { a: 0.15 }));
  setCSSVar("primary-overlay", multiply(settings.get("primary"), { a: 0.9 }));
  setCSSVar(
    "menuBar-transparentText",
    textColor(settings.get("menuBar"), "rgba(87, 94, 117, 0.25)", "rgba(255, 255, 255, 0.25)")
  );
  setCSSVar(
    "menuBar-dimText",
    textColor(settings.get("menuBar"), "rgba(87, 94, 117, 0.75)", "rgba(255, 255, 255, 0.75)")
  );
  setCSSVar("menuBar-filter", textColor(settings.get("menuBar"), "brightness(0.4)", "none"));
  setCSSVar(
    "menuBar-border",
    textColor(settings.get("menuBar"), "rgba(0, 0, 0, 0.15)", "rgba(255, 255, 255, 0.15)", 60)
  );
  setCSSVar("tab-text", textColor(settings.get("tab"), "rgba(87, 94, 117, 0.75)", "rgba(255, 255, 255, 0.75)"));
  setCSSVar("selector2-filter", textColor(settings.get("selector2"), "none", "brightness(0) invert(1)"));
  setCSSVar("accent-filter", textColor(settings.get("accent"), "none", "brightness(0) invert(1)"));
  setCSSVar(
    "accent-desaturateFilter",
    textColor(settings.get("accent"), "saturate(0)", "brightness(0) invert(1) opacity(0.7)")
  );
  setCSSVar("accent-opacity0", multiply(settings.get("accent"), { a: 0 }));
  setCSSVar(
    "input-transparentText",
    textColor(settings.get("input"), "rgba(87, 94, 117, 0.6)", "rgba(255, 255, 255, 0.4)")
  );
  setCSSVar("input-filter", textColor(settings.get("input"), "none", "brightness(0) invert(1)"));
  setCSSVar("input-transparent50", multiply(settings.get("input"), { a: 0.5 }));
  setCSSVar("input-transparent25", multiply(settings.get("input"), { a: 0.25 }));
  setCSSVar("workspace-codeZoomFilter", textColor(settings.get("workspace"), "none", "invert(1) hue-rotate(180deg)"));
  setCSSVar(
    "categoryMenu-selection",
    textColor(settings.get("categoryMenu"), "rgba(87, 124, 155, 0.13)", "rgba(255, 255, 255, 0.05)")
  );
  setCSSVar("palette-filter", textColor(settings.get("palette"), "none", "brightness(0) invert(1)"));
  lightDarkVariant("primary-variant", settings.get("primary"), 60, 0.67, 0.76, 0.8);
  lightDarkVariant("workspace-scrollbar", settings.get("workspace"), 170, 0.83, 0.83, 0.83, 0.87, 0.87, 0.87);
  lightDarkVariant("palette-scrollbar", settings.get("palette"), 170, 0.83, 0.83, 0.83, 0.92, 0.92, 0.92);
  if (settings.get("dots")) {
    setCSSVar(
      "workspace-dots",
      textColor(settings.get("workspace"), "rgba(0, 0, 0, 0.13)", "rgba(255, 255, 255, 0.13)")
    );
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
