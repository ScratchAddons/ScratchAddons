import RTCTableComponent from "./RTCTable.js";

export function createToolbar(heatmapManager, rtcHeader, config, polluteStepThread, msg, addon) {
  const toolbar = document.createElement("ul");
  toolbar.className = "sa-timing-toolbar sa-debugger-tabs";

  // create Heatmap slider
  const heatmapSlider = Object.assign(document.createElement("input"), {
    type: "range",
    step: "0.01",
    min: "0.0",
    max: "1.0",
    value: "1.0",
    className: "slider",
    style: "display:none",
  });
  heatmapSlider.addEventListener("input", () => heatmapManager.showHeatmapFn(heatmapSlider.value));

  const items = [
    {
      initialText: msg("timing-view-line-by-line"),
      toggledText: msg("timing-view-timers"),
      toggleState: () => {
        config.showLineByLine = !config.showLineByLine;
        if (!config.isStepThreadPolluted) polluteStepThread();
      },
    },
    {
      initialText: msg("timing-show-rtc"),
      toggledText: msg("timing-hide-rtc"),
      toggleState: () => {
        rtcHeader.style.display = rtcHeader.style.display === "none" ? "block" : "none";
        config.showRTC = !config.showRTC;
        if (!config.isStepThreadPolluted) polluteStepThread();
      },
    },
    {
      initialText: msg("timing-show-heatmap"),
      toggledText: msg("timing-hide-heatmap"),
      toggleState: () => {
        config.showHeatmap = !config.showHeatmap;
        heatmapSlider.style.display = config.showHeatmap ? "block" : "none";
        config.showHeatmap ? heatmapManager.showHeatmapFn(heatmapSlider.value) : heatmapManager.hideHeatmapFn();
      },
    },
  ];

  items.forEach(({ initialText, toggledText, toggleState }, index) => {
    const li = document.createElement("li");

    const textSpan = document.createElement("span");
    textSpan.textContent = initialText;

    li.appendChild(textSpan);

    li.addEventListener("click", () => {
      toggleState();
      textSpan.textContent = textSpan.textContent === initialText ? toggledText : initialText;
    });

    // For the second item, replace the tooltip with a "See Table" link
    if (index === 1) {
      const tooltip = document.createElement("div");
      tooltip.className = "sa-timing-tooltip-outer";
      tooltip.innerHTML = `
        <div class = "sa-timing-tooltip-content">
        <p>
          ${msg("timing-rtc-info", { table: `<a href="#" id="seeTableLink">${msg("timing-rtc-info-table")}</a>` })}
        </p>
        </div>
      `;

      // Add event listener for the "table" link to open the full-screen pop-up
      const seeTableLink = tooltip.querySelector("#seeTableLink");
      seeTableLink.addEventListener("click", (event) => {
        event.preventDefault();
        openTablePopup(addon.self.dir + "/timing/RTC.json", msg); // Open the table in a new window
      });

      li.classList.add("sa-timing-tooltip-container");
      li.appendChild(tooltip);
    }

    toolbar.appendChild(li);
  });

  toolbar.appendChild(heatmapSlider);

  return toolbar;
}

// Function to open a new pop-up window and render the RTC table
function openTablePopup(rtcDir, msg) {
  // Open a new window
  const popupWindow = window.open(
    "",
    "_blank",
    "toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=800,height=600"
  );

  // Set the title and initial layout for the new window
  popupWindow.document.title = msg("timing-rtc");
  popupWindow.document.body.style.margin = "0";
  popupWindow.document.body.style.display = "flex";
  popupWindow.document.body.style.justifyContent = "center";
  popupWindow.document.body.style.alignItems = "center";
  popupWindow.document.body.style.height = "100vh";
  popupWindow.document.body.style.backgroundColor = "#f0f0f0";

  // Create a container for the RTC table in the pop-up
  const rtcTableContainer = popupWindow.document.createElement("div");
  rtcTableContainer.id = "rtcTableContainer";
  rtcTableContainer.style.width = "100%";
  rtcTableContainer.style.height = "100%";
  rtcTableContainer.style.overflow = "auto"; // Enable scrolling if the content overflows

  popupWindow.document.body.appendChild(rtcTableContainer);

  // Create and render the RTC table component inside the pop-up window
  const rtcTableComponent = new RTCTableComponent(rtcDir);
  rtcTableComponent.renderInto(rtcTableContainer);

  // Write the HTML structure including your table and CSS styles
  const style = popupWindow.document.createElement("style");
  style.innerHTML = `
  /* Table styles for the popout window */
  .sa-rtc-table {
    border-collapse: collapse;
    width: 100%;
    margin: 0;
    color: black;
    font-family: cursive;
    font-size: 12px;
  }

  .sa-rtc-table th, .sa-rtc-table td {
    border: 1px solid #ccc;
    text-align: center;
    padding: 3px; /* Padding for better readability */
    word-wrap: break-word; /* Ensure long text wraps within the cell */
    white-space: normal; /* Prevent text from overflowing */
  }

  /* Styling for table header */
  .sa-rtc-table th {
    background-color: #f2f2f2;
    font-weight: bold;
  }

  /* Ensure the table fits within the popout container */
  #rtcTableContainer {
    width: 100%;
    height: 100%;
    overflow: auto; /* Enable scrolling if the table overflows the container */
  }
  `;
  popupWindow.document.head.appendChild(style);
}
