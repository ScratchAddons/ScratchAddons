export default async function ({ addon, global, console }) {
  var style = document.createElement("style");
  var stylesheet = `path.blocklyBlockBackground[fill="#FF6680"],
	path.blocklyBlockBackground[fill="#5CB1D6"],
	path.blocklyBlockBackground[fill="#FFBF00"],
	g[data-category] > path.blocklyBlockBackground {
		stroke: #0003;
	}
	g[data-argument-type="dropdown"] > path,
	g[data-argument-type="dropdown"] > rect,
	g[data-argument-type="variable"] > rect,
	g[data-argument-type="variable"] > path,
	g[data-shapes="c-block c-1 hat"] > g[data-shapes="stack"] > path,
	path[data-argument-type="boolean"] {
		stroke: #0003;
		fill: #0001;
	}
	g[data-argument-type*="text"] > path,
	g > line {
		stroke: #0002;
	}
	.scratchCategoryItemBubble {
		border-color: #0003 !important;
	}
	`;

  var categories = {
    motion: {
      color: "#4C97FF",
    },
    looks: {
      color: "#9966FF",
    },
    sounds: {
      color: "#CF63CF",
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
      categories[prop].color = "#" + Math.floor(Math.random() * 16777215).toString(16);
    } else {
      categories[prop].color = addon.settings.get(prop + "-color");
    }
    stylesheet += `g[data-category="${prop}"] > path.blocklyBlockBackground {
			fill: ${categories[prop].color};
			stroke: ${adjust(categories[prop].color, -35)} !important;
		}
		.scratchCategoryId-${categories[prop].alt ? categories[prop].alt : prop} > .scratchCategoryItemBubble {
			background-color: ${categories[prop].color} !important;
		}
	    `;
    if (prop == "custom") {
      stylesheet += `path.blocklyBlockBackground[fill="#FF6680"] {
				fill: ${categories[prop].color} !important;
				stroke: ${adjust(categories[prop].color, -35)} !important;
        	}`;
    }
    if (prop == "sensing") {
      stylesheet += `path.blocklyBlockBackground[fill="#5CB1D6"] {
				fill: ${categories[prop].color};
				stroke: ${adjust(categories[prop].color, -35)} !important;
        	}`;
    }
    if (prop == "events") {
      stylesheet += `path.blocklyBlockBackground[fill="#FFBF00"] {
				fill: ${categories[prop].color};
				stroke: ${adjust(categories[prop].color, -35)} !important;
        	}`;
    }
  }

  function adjust(color, amount) {
    return (
      "#" +
      color
        .replace(/^#/, "")
        .replace(/../g, (color) =>
          ("0" + Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).substr(-2)
        )
    );
  }

  style.innerHTML = stylesheet;

  document.head.appendChild(style);
}
