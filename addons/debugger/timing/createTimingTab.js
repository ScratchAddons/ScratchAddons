import TimingManager from "./TimingManager.js";
import HeatmapManager from "./HeatmapManager.js";
import Profiler from "./Profiler.js";
import { createToolbar } from "./ui-components/toolbar.js";
import { createTableHeader } from "./ui-components/tableHeader.js";
import TableRows from "./ui-components/TableRows.js"; // Importing the extended LogView class
import downloadBlob from "../../../libraries/common/cs/download-blob.js";

export default async function createTimingTab({ debug, addon, console, msg }) {
  function createContent() {
    const content = Object.assign(document.createElement("div"), {
      className: "sa-timing-content",
    });
    content.append(toolbar);
    content.appendChild(tableHeader);
    content.appendChild(tableRows.outerElement);

    return content;
  }

  function createToolsButton() {
    const toolsButton = debug.createHeaderButton({
      text: msg("tools"),
      icon: addon.self.dir + "/icons/tools.svg",
    });

    toolsButton.element.addEventListener("click", () => {
      toolbar.classList.toggle("show");
    });

    return toolsButton;
  }

  function createExportButton() {
    const exportButton = debug.createHeaderButton({
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

  function updatePercentageHeader() {
    const value = addon.settings.get("show_ratio_time");
    config.showRatioTime = value;
    percentHeader.textContent = value ? "Ratio Time" : "Percent Time";
  }

  // config for our block scope settings that can be modified in the toolbar
  const config = {
    showRTC: false,
    showLineByLine: false,
    showHeatmap: false,
    showRatioTime: false,
    sortHeader: null,
    sortDirection: "descending",
  };
  const { tableHeader, rtcHeader, percentHeader } = createTableHeader();
  const tableRows = new TableRows(config, debug, msg, tableHeader);

  const timingManager = new TimingManager(addon.settings, config);
  const heatmapManager = new HeatmapManager(() => addon.tab.traps.getWorkspace(), tableRows);
  const toolbar = createToolbar(heatmapManager, rtcHeader, config);

  const content = createContent();
  const exportButton = createExportButton();
  const toolsButton = createToolsButton();

  // setup events
  debug.addAfterStepCallback(() => {
    tableRows.updateLogRows(timingManager.getTimers(), config.showLineByLine);
  });

  addon.settings.addEventListener("change", function () {
    updatePercentageHeader();
  });
  if (addon.settings.get("show_ratio_time") === true) updatePercentageHeader();

  [tableRows.outerElement, tableHeader].forEach((el) => {
    el.addEventListener("click", () => {
      toolbar.classList.remove("show");
    });
  });

  // pollute stepThread with our new Profiler to handle line by line profiling
  const profiler = new Profiler(addon.tab.traps.vm, timingManager, config);
  timingManager.dummyProfiler = profiler;
  profiler.polluteStepThread();
  fetch(addon.self.dir + "/RTC.json")
    .then((res) => res.json())
    .then((data) => {
      profiler.rtcTable = data;
    })
    .catch((error) => console.error("Error loading JSON:", error));

  // create the tab
  const tab = debug.createHeaderTab({
    text: msg("tab-timing"),
    icon: addon.self.dir + "/icons/timing.svg",
  });

  return {
    tab,
    content,
    buttons: [exportButton, toolsButton],
    show: () => tableRows.show(),
    hide: () => tableRows.hide(),
    startTimer: timingManager.startTimer.bind(timingManager),
    stopTimer: timingManager.stopTimer.bind(timingManager),
    clearTimers: timingManager.clearTimers.bind(timingManager),
  };
}
