import { textColor } from "../../libraries/text_color.js";

function updateSettings(addon, initialStylesheet) {
  var stylesheet = "";
  var categories = {
    motion: {
      color: "#4C97FF",
    },
    looks: {
      color: "#9966FF",
    },
    sounds: {
      color: "#CF63CF",
      alt: "sound",
    },
    events: {
      color: "#DE9E2E",
    },
    control: {
      color: "#FFBF00",
    },
    sensing: {
      color: "#5CB1D6",
    },
    operators: {
      color: "#59C059",
    },
    data: {
      color: "#FF8C1A",
      alt: "variables",
    },
    "data-lists": {
      color: "#FF661A",
      alt: "lists",
      var: "dataLists",
    },
    custom: {
      color: "#FF6680",
      alt: "myBlocks",
    },
    Pen: {
      // For historical reasons, this is called "Pen".
      color: "#0FBD8C",
      alt: "pen",
    },
  };

  for (var prop of Object.keys(categories)) {
    stylesheet += `g[data-category="${prop}"] > path.blocklyBlockBackground {
			fill: var(--editorTheme3-${categories[prop].var ? categories[prop].var : prop}Color);
		}
		.scratchCategoryId-${categories[prop].alt ? categories[prop].alt : prop} > .scratchCategoryItemBubble {
			background-color: var(--editorTheme3-${categories[prop].var ? categories[prop].var : prop}Color) !important;
		}
    .blocklyDropDownDiv[data-category="${prop}"] {
      background-color: var(--editorTheme3-${categories[prop].var ? categories[prop].var : prop}Color) !important;
    }
	    `;
    if (prop === "custom") {
      stylesheet += `path.blocklyBlockBackground[fill="#FF6680"] {
				fill: var(--editorTheme3-${prop}Color) !important;
      }
      path.blocklyBlockBackground[fill="#FF6680"] ~ .blocklyText,
      path.blocklyBlockBackground[fill="#FF4D6A"] ~ .blocklyText {
        fill: ${textColor(addon.settings.get(prop + "-color"))};
          }`;
    }
    if (prop === "sensing") {
      stylesheet += `path.blocklyBlockBackground[fill="#5CB1D6"] {
				fill: var(--editorTheme3-${prop}Color);
        	}`;
    }
    if (prop === "events") {
      stylesheet += `path.blocklyBlockBackground[fill="#FFBF00"] {
				fill: var(--editorTheme3-${prop}Color);
        }
        .blocklyDropDownDiv[style*="rgb(255, 191, 0)"] {
          background-color: var(--editorTheme3-${prop}Color) !important;
        }`;
    }
    if (prop === "Pen") {
      stylesheet += `path.blocklyBlockBackground[fill="#0FBD8C"] {
				fill: var(--editorTheme3-${prop}Color);
        }
        .blocklyDropDownDiv[style*="rgb(15, 189, 140)"] {
          background-color: var(--editorTheme3-${prop}Color) !important;
        }`;
    }
  }
  document.documentElement.style.setProperty("--editorTheme3-inputColor-text", textColor(addon.settings.get("input-color")));

  document.querySelector(".scratch-addons-theme[data-addon-id='editor-theme3']").textContent = initialStylesheet + stylesheet;
}

export default async function ({ addon, global, console }) {
  const initialStylesheet = document.querySelector(".scratch-addons-theme[data-addon-id='editor-theme3']").textContent;
  updateSettings(addon, initialStylesheet);
  addon.settings.addEventListener("change", () => {updateSettings(addon, initialStylesheet)});
}
