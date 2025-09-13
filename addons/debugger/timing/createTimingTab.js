import TimingManager from "./TimingManager.js";
import HeatmapManager from "./HeatmapManager.js";
import Profiler from "./Profiler.js";
import { createTableHeader } from "./ui-components/tableHeader.js";
import TableRows from "./ui-components/TableRows.js"; // Importing the extended LogView class
import downloadBlob from "../../../libraries/common/cs/download-blob.js";
import { isPaused, onPauseChanged, getRunningThread } from "../module.js";

export default async function createTimingTab({ debug, addon, console, msg }) {
  function createContent() {
    const content = Object.assign(document.createElement("div"), {
      className: "sa-timing-content",
    });
    content.appendChild(tableHeader);
    content.appendChild(tableRows.outerElement);

    return content;
  }

  function createLineByLineButton() {
    const lineByLineButton = debug.createIconButton({
      text: msg("timing-profiling"),
      icon: addon.self.dir + "/icons/speedometer.svg",
    });

    // Add checkbox to the right side of the button
    const checkbox = Object.assign(document.createElement("input"), {
      type: "checkbox",
      className: "sa-timing-checkbox",
    });

    // Add specific class
    lineByLineButton.element.classList.add("sa-timing-profiling-toggle");

    // Append checkbox to button
    lineByLineButton.element.appendChild(checkbox);

    // Make entire button clickable to toggle checkbox
    lineByLineButton.element.addEventListener("click", (e) => {
      // Don't double-toggle if clicking directly on checkbox
      if (e.target !== checkbox) {
        checkbox.checked = !checkbox.checked;
        checkbox.dispatchEvent(new Event("change"));
      }
    });

    // Handle checkbox change
    checkbox.addEventListener("change", () => {
      config.showLineByLine = checkbox.checked;
      if (config.showLineByLine && !config.isStepThreadPolluted) {
        polluteStepThread();
      } else if (!config.showLineByLine && config.isStepThreadPolluted) {
        unpollutStepThread();
      }
    });

    return lineByLineButton;
  }

  function createHeatmapButton() {
    const heatmapButton = debug.createIconButton({
      text: msg("timing-heatmap"),
      icon: addon.self.dir + "/icons/flame.svg",
    });

    // Add checkbox to the right side of the button
    const checkbox = Object.assign(document.createElement("input"), {
      type: "checkbox",
      className: "sa-timing-checkbox",
    });

    // Add specific class to disable hover effect
    heatmapButton.element.classList.add("sa-timing-heatmap-toggle");

    // Append checkbox to button
    heatmapButton.element.appendChild(checkbox);

    // Make entire button clickable to toggle checkbox
    heatmapButton.element.addEventListener("click", (e) => {
      // Don't double-toggle if clicking directly on checkbox
      if (e.target !== checkbox) {
        checkbox.checked = !checkbox.checked;
        checkbox.dispatchEvent(new Event("change"));
      }
    });

    // Handle checkbox change
    checkbox.addEventListener("change", () => {
      config.showHeatmap = checkbox.checked;
      if (config.showHeatmap) {
        heatmapManager.showHeatmapFn(1.0);
      } else {
        heatmapManager.hideHeatmapFn();
      }
    });

    return heatmapButton;
  }

  function createExportButton() {
    const exportButton = debug.createIconButton({
      text: msg("export"),
      icon: addon.self.dir + "/icons/download-white.svg",
    });

    exportButton.element.addEventListener("click", () => {
      const csvContent = tableRows.rows.map((row) => Object.values(tableRows.getRowValues(row)).join(",")).join("\n");
      const filename = `timing_${tableRows.rows[0].label}.csv`;
      if (csvContent) downloadBlob(filename, new Blob([csvContent], { type: "text/plain" }));
    });

    return exportButton;
  }

  function createClearButton() {
    const clearButton = debug.createIconButton({
      text: msg("clear"),
      icon: addon.self.dir + "/icons/delete.svg",
    });

    clearButton.element.addEventListener("click", () => {
      // Clear both timers and profiling (line-by-line) data
      timingManager.clearTimers();
      // Update the table to show empty state
      tableRows.updateLogRows(timingManager.getTimers(), config.showLineByLine);
      // Hide heatmap if it's currently shown
      if (config.showHeatmap) {
        heatmapManager.hideHeatmapFn();
      }
    });

    return clearButton;
  }

  function updatePercentageHeader() {
    const value = addon.settings.get("show_ratio_time");
    config.showRatioTime = value;
    percentHeader.textContent = value ? msg("timing-ratio-time") : msg("timing-percent-time");
  }

  // config for our block scope settings that can be modified in the toolbar
  const config = {
    showLineByLine: false,
    showHeatmap: false,
    showRatioTime: false,
    sortHeader: null,
    sortDirection: "descending",
    isStepThreadPolluted: false,
  };
  const { tableHeader, percentHeader } = createTableHeader(config, msg);
  const tableRows = new TableRows(config, debug, msg, tableHeader);

  const profiler = new Profiler(config);
  // function to pollute stepThread with our new Profiler to handle line by line profiling
  const polluteStepThread = () => profiler.polluteStepThread(addon.tab.traps.vm, timingManager);
  const unpollutStepThread = () => profiler.unpollutStepThread();

  const timingManager = new TimingManager(addon.settings, config, profiler);
  const heatmapManager = new HeatmapManager(() => addon.tab.traps.getWorkspace(), tableRows, config);
  profiler.tm = timingManager;

  const content = createContent();
  const exportButton = createExportButton();
  const clearButton = createClearButton();
  const lineByLineButton = createLineByLineButton();
  const heatmapButton = createHeatmapButton();

  // setup events
  debug.addAfterStepCallback(() => {
    tableRows.updateLogRows(timingManager.getTimers(), config.showLineByLine);
  });

  // Handle single-step state changes
  const handleSingleStepChange = (paused) => {
    const isSingleStepping = paused && getRunningThread();
    if (isSingleStepping && config.showLineByLine) {
      config.showLineByLine = false;
      profiler.unpollutStepThread();
    }
    // Update button disabled states
    lineByLineButton.element.disabled = isSingleStepping;
    if (isSingleStepping) {
      lineByLineButton.element.classList.add("sa-timing-disabled");
    } else {
      lineByLineButton.element.classList.remove("sa-timing-disabled");
    }
  };

  handleSingleStepChange(isPaused());
  onPauseChanged(handleSingleStepChange);

  // Handle sprite switching to reapply heatmap
  addon.tab.redux.addEventListener("statechanged", ({ detail }) => {
    if (detail.action.type === "scratch-gui/targets/UPDATE_TARGET_LIST") {
      // When sprite switches and heatmap is enabled, reapply the heatmap
      if (config.showHeatmap) {
        // Use setTimeout to ensure blocks are recreated before applying heatmap
        setTimeout(() => {
          heatmapManager.showHeatmapFn(1.0);
        }, 10);
      }
    }
  });

  addon.settings.addEventListener("change", function () {
    updatePercentageHeader();
  });
  if (addon.settings.get("show_ratio_time") === true) updatePercentageHeader();

  // create the tab
  const tab = debug.createHeaderTab({
    text: msg("tab-timing"),
    icon: addon.self.dir + "/icons/timing.svg",
  });

  return {
    tab,
    content,
    buttons: [exportButton, clearButton, lineByLineButton, heatmapButton],
    show: () => tableRows.show(),
    hide: () => tableRows.hide(),
    startTimer: timingManager.startTimer.bind(timingManager),
    stopTimer: timingManager.stopTimer.bind(timingManager),
    clearTimers: timingManager.clearTimers.bind(timingManager),
  };
}
