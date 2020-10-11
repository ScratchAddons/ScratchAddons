export default async function ({ addon, global, console }) {
  var style = document.createElement("style");
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
      color: "#0FBD8C",
      alt: "pen",
    },
  };

  for (var prop in categories) {
    if (addon.settings.get("randomize-color")) {
      document
        .querySelector("html")
        .style.setProperty(
          `--editorTheme3-${categories[prop].var ? categories[prop].var : prop}Color`,
          "#" + ("00000" + ((Math.random() * (1 << 24)) | 0).toString(16)).slice(-6)
        );
    }
    stylesheet += `g[data-category="${prop}"] > path.blocklyBlockBackground {
			fill: var(--editorTheme3-${categories[prop].var ? categories[prop].var : prop}Color);
		}
		.scratchCategoryId-${categories[prop].alt ? categories[prop].alt : prop} > .scratchCategoryItemBubble {
			background-color: var(--editorTheme3-${categories[prop].var ? categories[prop].var : prop}Color) !important;
		}
	    `;
    if (prop == "custom") {
      stylesheet += `path.blocklyBlockBackground[fill="#FF6680"] {
				fill: var(--editorTheme3-${prop}Color) !important;
        	}`;
    }
    if (prop == "sensing") {
      stylesheet += `path.blocklyBlockBackground[fill="#5CB1D6"] {
				fill: var(--editorTheme3-${prop}Color);
        	}`;
    }
    if (prop == "events") {
      stylesheet += `path.blocklyBlockBackground[fill="#FFBF00"] {
				fill: var(--editorTheme3-${prop}Color);
        	}`;
    }
  }

  document.querySelector(".scratch-addons-theme[data-addon-id='editor-theme3']").textContent += stylesheet;
}
