import { textColor, multiply } from "../../libraries/common/cs/text-color.esm.js";

function updateSettings(addon, newStyle) {
  var stylesheet = "";
  const textMode = addon.settings.get("text");
  if (textMode === "black") {
    stylesheet += `
      .blocklyText {
        fill: #575e75;
      }
      .blocklyDropdownText {
        fill: #575e75 !important;
      }
      .blocklyDropDownDiv .goog-menuitem,
      #s3devIDD > li {
        color: #575e75;
      }`;
  }
  if (textMode === "colorOnWhite") {
    stylesheet += `
      .blocklyDropDownDiv:not([style*="rgb(255, 255, 255)"]) .goog-menuitem {
        color: #575e75;
      }`;
  }
  if (textMode === "colorOnBlack") {
    stylesheet += `
      .blocklyDropDownDiv:not([style*="rgb(255, 255, 255)"]) .goog-option-selected .goog-menuitem-checkbox {
        filter: brightness(0) invert(1);
      }
      .u-dropdown-searchbar {
        border-color: rgba(255, 255, 255, 0.15);
      }`;
  }
  var categories = {
    motion: {
      color: "#4C97FF",
      tertiaryColor: "#3373CC",
    },
    looks: {
      color: "#9966FF",
      tertiaryColor: "#774DCB",
    },
    sounds: {
      color: "#CF63CF",
      tertiaryColor: "#BD42BD",
      alt: "sound",
    },
    events: {
      color: "#DE9E2E",
      tertiaryColor: "#CC9900",
    },
    control: {
      color: "#FFBF00",
      tertiaryColor: "#CF8B17",
    },
    sensing: {
      color: "#5CB1D6",
      tertiaryColor: "#2E8EB8",
    },
    operators: {
      color: "#59C059",
      tertiaryColor: "#389438",
    },
    data: {
      color: "#FF8C1A",
      tertiaryColor: "#DB6E00",
      alt: "variables",
    },
    "data-lists": {
      color: "#FF661A",
      tertiaryColor: "#E64D00",
      alt: "lists",
      var: "dataLists",
    },
    custom: {
      color: "#FF6680",
      tertiaryColor: "#FF6355",
      alt: "myBlocks",
    },
    Pen: {
      // For historical reasons, this is called "Pen".
      color: "#0FBD8C",
      tertiaryColor: "#0B8E69",
      alt: "pen",
    },
    sa: {
      color: "#29beb8",
      tertiaryColor: "#3aa8a4",
    },
  };

  for (var prop of Object.keys(categories)) {
    var settingName = categories[prop].var ? categories[prop].var : prop;
    if (textMode === "white" || textMode === "black") {
      let tertiary = multiply(addon.settings.get(prop + "-color"), { r: 0.8, g: 0.8, b: 0.8 });
      stylesheet += `g[data-category="${prop}"] > path.blocklyBlockBackground {
        fill: var(--editorTheme3-${settingName}Color);
        ${textMode === "black" ? "--sa-block-text-color: #575e75;" : ""}
      }
      .blocklyBlockBackground[fill="${categories[prop].tertiaryColor}"] /* open dropdown */ {
        fill: #0003;
      }
      .scratchCategoryId-${categories[prop].alt ? categories[prop].alt : prop} > .scratchCategoryItemBubble {
        background-color: var(--editorTheme3-${settingName}Color) !important;
      }
      .blocklyDropDownDiv[data-category="${prop}"]:not([style*="rgb(255, 255, 255)"]) {
        background-color: var(--editorTheme3-${settingName}Color) !important;
        border-color: #0003 !important;
      }
      .blocklyBubbleCanvas [stroke="${categories[prop].tertiaryColor}"] {
        stroke: var(--editorTheme3-${settingName}Color);
      }
      #s3devIDD > li.${prop} {
        background-color: var(--editorTheme3-${settingName}Color);
      }
      #s3devIDD > li.${prop}:hover,
      #s3devIDD > li.${prop}.sel {
        background-color: ${tertiary};
      }
      .sa-debugger-block-preview[data-category="${prop}"] {
        background-color: var(--editorTheme3-${settingName}Color) !important;
      }
      `;
      if (prop === "custom") {
        stylesheet += `path.blocklyBlockBackground[fill="#FF6680"] {
          fill: var(--editorTheme3-${prop}Color);
          ${textMode === "black" ? "--sa-block-text-color: #575e75;" : ""}
        }
        #s3devIDD > li.null {
          background-color: var(--editorTheme3-${settingName}Color);
        }
        #s3devIDD > li.null:hover,
        #s3devIDD > li.null.sel {
          background-color: ${tertiary};
        }`;
      }
      if (prop === "sensing") {
        stylesheet += `path.blocklyBlockBackground[fill="#5CB1D6"] {
          fill: var(--editorTheme3-${prop}Color);
          ${textMode === "black" ? "--sa-block-text-color: #575e75;" : ""}
        }`;
      }
      if (prop === "events") {
        stylesheet += `path.blocklyBlockBackground[fill="#FFBF00"] {
          fill: var(--editorTheme3-${prop}Color);
          ${textMode === "black" ? "--sa-block-text-color: #575e75;" : ""}
        }
        .blocklyDropDownDiv[style*="rgb(255, 191, 0)"] {
          background-color: var(--editorTheme3-${prop}Color) !important;
          border-color: #0003 !important;
        }`;
      }
      if (prop === "Pen") {
        stylesheet += `path.blocklyBlockBackground[fill="#0FBD8C"] {
          fill: var(--editorTheme3-${prop}Color);
          ${textMode === "black" ? "--sa-block-text-color: #575e75;" : ""}
        }
        .blocklyDropDownDiv[style*="rgb(15, 189, 140)"] {
          background-color: var(--editorTheme3-${prop}Color) !important;
          border-color: #0003 !important;
        }
        #s3devIDD > li.extension {
          background-color: var(--editorTheme3-${settingName}Color);
        }
        #s3devIDD > li.extension:hover,
        #s3devIDD > li.extension.sel {
          background-color: ${tertiary};
        }`;
      }
      if (prop === "sa") {
        stylesheet += `path.blocklyBlockBackground[fill="#29beb8"] {
          fill: var(--editorTheme3-${prop}Color);
          ${textMode === "black" ? "--sa-block-text-color: #575e75;" : ""}
        }`;
      }
    } else {
      let background = { colorOnWhite: "#fff", colorOnBlack: "#282828" }[textMode];
      let inputShadow = { colorOnWhite: "#00000026", colorOnBlack: "#fff3" }[textMode];
      let secondary = multiply(addon.settings.get(prop + "-color"), { a: 0.15 });
      let secondaryActive = multiply(addon.settings.get(prop + "-color"), { a: 0.25 });
      let menuText = { colorOnWhite: "#575e75", colorOnBlack: "#fff" }[textMode];
      stylesheet += `g[data-category="${prop}"] > path.blocklyBlockBackground,
      g[data-category="${prop}"] > g[data-argument-type="dropdown"] > rect,
      g[data-category="${prop}"] > g[data-argument-type="variable"] > rect {
        fill: ${background};
        stroke: var(--editorTheme3-${settingName}Color);
        --sa-block-text-color: ${menuText};
        --sa-block-secondary-color: ${secondaryActive};
      }
      g[data-category="${prop}"] > .blocklyText,
      g[data-category="${prop}"] > g:not([data-id]) > .blocklyText /* variable and list reporters */ {
        fill: var(--editorTheme3-${settingName}Color);
      }
      g[data-category="${prop}"] > g[data-argument-type="dropdown"] > .blocklyDropdownText,
      g[data-category="${prop}"] > g[data-argument-type="variable"] > .blocklyDropdownText,
      g[data-category="${prop}"] > g[data-argument-type="dropdown"] > g > .blocklyDropdownText {
        fill: var(--editorTheme3-${settingName}Color) !important;
      }
      g[data-category="${prop}"] > g[data-argument-type="dropdown"] > path,
      g[data-category="${prop}"] > g[data-argument-type="variable"] > path,
      g[data-category="${prop}"] > path[data-argument-type="boolean"] {
        fill: ${secondary};
        stroke: var(--editorTheme3-${settingName}Color);
      }
      .blocklyBlockBackground[fill="${categories[prop].tertiaryColor}"] /* open dropdown */ {
        fill: ${secondaryActive} !important;
      }
      .scratchCategoryId-${categories[prop].alt ? categories[prop].alt : prop} > .scratchCategoryItemBubble {
        background-color: var(--editorTheme3-${settingName}Color) !important;
      }
      .blocklyDropDownDiv[data-category="${prop}"]:not([style*="rgb(255, 255, 255)"]) {
        background-color: ${background} !important;
        border-color: var(--editorTheme3-${settingName}Color) !important;
      }
      .blocklyDropDownDiv[data-category="${prop}"] .goog-menuitem-highlight {
        background-color: ${secondaryActive};
      }
      .blocklyBubbleCanvas [stroke="${categories[prop].tertiaryColor}"],
      g[data-category=${prop}] > g[data-argument-type*="text"] > path,
      g[data-category=${prop}] > g > line  {
        stroke: var(--editorTheme3-${settingName}Color);
      }
      .blocklyWidgetDiv.fieldTextInput[style*="box-shadow"] {
        box-shadow: 0 0 0 4px ${inputShadow} !important;
      }
      #s3devIDD > li.${prop} {
        background-color: ${secondary};
        color: var(--editorTheme3-${settingName}Color);
      }
      #s3devIDD > li.${prop}:hover,
      #s3devIDD > li.${prop}.sel {
        background-color: ${secondaryActive};
      }`;
      if (prop === "custom") {
        stylesheet += `path.blocklyBlockBackground[fill="#FF6680"] {
          fill: ${background};
          stroke: var(--editorTheme3-${prop}Color);
          --sa-block-text-color: ${menuText};
          --sa-block-secondary-color: ${secondaryActive};
        }
        path.blocklyBlockBackground[fill="#FF6680"] ~ .blocklyText,
        g[data-shapes="c-block c-1 hat"] > g[data-shapes="stack"]:not(.blocklyDraggable) > .blocklyText,
        .blocklyEditableText > rect[fill="#FF3355"] ~ .blocklyText {
          fill: var(--editorTheme3-${prop}Color);
        }
        path.blocklyBlockBackground[fill="#FF6680"] ~ [data-argument-type="text"] > path {
          stroke: var(--editorTheme3-${prop}Color);
        }
        g[data-shapes="c-block c-1 hat"] > g[data-shapes="stack"]:not(.blocklyDraggable) > path,
        path[data-argument-type="boolean"][fill="#FF3355"] {
          fill: ${secondary};
          stroke: var(--editorTheme3-${prop}Color);
        }
        .blocklyEditableText > rect[fill="#FF3355"] {
          fill: ${secondary};
        }
        #s3devIDD > li.null {
          background-color: ${secondary};
          color: var(--editorTheme3-${settingName}Color);
        }
        #s3devIDD > li.null:hover,
        #s3devIDD > li.null.sel {
          background-color: ${secondaryActive};
        }`;
      }
      if (prop === "sensing") {
        stylesheet += `path.blocklyBlockBackground[fill="#5CB1D6"],
        g[data-argument-type="dropdown"] > rect[fill="#5CB1D6"] {
          fill: ${background};
          stroke: var(--editorTheme3-${prop}Color);
          --sa-block-text-color: ${menuText};
          --sa-block-secondary-color: ${secondaryActive};
        }
        g[data-argument-type="dropdown"] > path[fill="#47A8D1"] {
          fill: ${secondary};
          stroke: var(--editorTheme3-${prop}Color);
        }
        path.blocklyBlockBackground[fill="#5CB1D6"] ~ .blocklyText {
          fill: var(--editorTheme3-${prop}Color);
        }
        g[data-argument-type="dropdown"] > rect[fill="#5CB1D6"] ~ .blocklyText,
        g[data-argument-type="dropdown"] > rect[fill="#2E8EB8"] ~ .blocklyText,
        g[data-argument-type="dropdown"] > path[fill="#47A8D1"] ~ * > .blocklyText,
        g[data-argument-type="dropdown"] > path[fill="#2E8EB8"] ~ * > .blocklyText {
          fill: var(--editorTheme3-${prop}Color) !important;
        }
        .blocklyDropDownDiv[style*="rgb(92, 177, 214)"] {
          background-color: ${background} !important;
          border-color: var(--editorTheme3-${settingName}Color) !important;
        }
        .blocklyDropDownDiv[style*="rgb(92, 177, 214)"] .goog-menuitem-highlight {
          background-color: ${secondaryActive};
        }`;
      }
      if (prop === "events") {
        stylesheet += `path.blocklyBlockBackground[fill="#FFBF00"],
        g[data-argument-type="dropdown"] > rect[fill="#FFBF00"],
        g[data-argument-type="dropdown"] > rect[fill="#CC9900"] {
          fill: ${background};
          stroke: var(--editorTheme3-${settingName}Color);
          --sa-block-text-color: ${menuText};
          --sa-block-secondary-color: ${secondaryActive};
        }
        path.blocklyBlockBackground[fill="#FFBF00"] ~ .blocklyText {
          fill: var(--editorTheme3-${prop}Color);
        }
        path.blocklyBlockBackground[fill="#FFBF00"] ~ g[data-argument-type="variable"] > g > .blocklyDropdownText {
          fill: var(--editorTheme3-${prop}Color) !important;
        }
        g[data-argument-type="dropdown"] > rect[fill="#FFBF00"] ~ .blocklyText,
        g[data-argument-type="dropdown"] > rect[fill="#CC9900"] ~ .blocklyText {
          fill: var(--editorTheme3-${prop}Color) !important;
        }
        .blocklyDropDownDiv[style*="rgb(255, 191, 0)"] {
          background-color: ${background} !important;
          border-color: var(--editorTheme3-${settingName}Color) !important;
        }
        .blocklyDropDownDiv[style*="rgb(255, 191, 0)"] .goog-menuitem-highlight {
          background-color: ${secondaryActive};
        }`;
      }
      if (prop === "Pen") {
        stylesheet += `g[data-category] /* specificity */ > path.blocklyBlockBackground[fill="#0FBD8C"] {
          fill: ${background};
          stroke: var(--editorTheme3-${prop}Color);
          --sa-block-text-color: ${menuText};
          --sa-block-secondary-color: ${secondaryActive};
        }
        path.blocklyBlockBackground[fill="#0FBD8C"] ~ .blocklyText {
          fill: var(--editorTheme3-${prop}Color);
        }
        path.blocklyBlockBackground[fill="#0FBD8C"] ~ g[data-argument-type="dropdown"] > g > .blocklyDropdownText {
          fill: var(--editorTheme3-${prop}Color) !important;
        }
        g[data-argument-type="dropdown"] > path[fill="#0DA57A"] {
          fill: ${secondary};
          stroke: var(--editorTheme3-${prop}Color);
        }
        .blocklyDropDownDiv[style*="rgb(15, 189, 140)"] {
          background-color: ${background} !important;
          border-color: var(--editorTheme3-${settingName}Color) !important;
        }
        .blocklyDropDownDiv[style*="rgb(15, 189, 140)"] .goog-menuitem-highlight {
          background-color: ${secondaryActive};
        }
        path.blocklyBlockBackground[fill="#0FBD8C"] ~ [data-argument-type="text"] > path,
        path.blocklyBlockBackground[fill="#0FBD8C"] ~ g > line  {
          stroke: var(--editorTheme3-${prop}Color);
        }
        #s3devIDD > li.extension {
          background-color: ${secondary};
          color: var(--editorTheme3-${settingName}Color);
        }
        #s3devIDD > li.extension:hover,
        #s3devIDD > li.extension.sel {
          background-color: ${secondaryActive};
        }`;
      }
      if (prop === "sa") {
        stylesheet += `path.blocklyBlockBackground[fill="#29beb8"] {
          fill: ${background};
          stroke: var(--editorTheme3-${prop}Color);
          --sa-block-text-color: ${menuText};
          --sa-block-secondary-color: ${secondaryActive};
        }
        path.blocklyBlockBackground[fill="#29beb8"] ~ .blocklyText {
          fill: var(--editorTheme3-${prop}Color);
        }
        path.blocklyBlockBackground[fill="#29beb8"] ~ [data-argument-type="text"] > path {
          stroke: var(--editorTheme3-${prop}Color);
        }`;
      }
    }
  }

  document.documentElement.style.setProperty(
    "--editorTheme3-inputColor-text",
    textColor(addon.settings.get("input-color"))
  );
  newStyle.textContent = stylesheet;
}

export default async function ({ addon, global, console }) {
  const otherStyle = document.querySelector(`[data-addon-id='${addon.self.id}']`);
  const newStyle = document.createElement("style");
  updateSettings(addon, newStyle);
  addon.settings.addEventListener("change", () => {
    updateSettings(addon, newStyle);
  });
  newStyle.className = "scratch-addons-style";
  newStyle.setAttribute("data-addon-id", addon.self.id);
  newStyle.setAttribute("data-addon-index", otherStyle.getAttribute("data-addon-index"));

  document.documentElement.insertBefore(newStyle, otherStyle.nextSibling);

  // Look for reenable event to enable the style. cs.js cannot handle an appended style.
  addon.self.addEventListener("reenabled", () => (newStyle.disabled = false));
}
