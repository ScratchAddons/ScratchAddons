import LogView from "../../log-view.js"; // Assuming LogView is imported from elsewhere

function createInfoElement(text) {
  const elem = document.createElement("span");
  elem.textContent = text;
  return elem;
}

class TableRows extends LogView {
  constructor(config, debug, msg, tableHeader) {
    super();
    this.config = config;
    this.totalTime = null;
    this.minTimerTime = null;
    this.debug = debug;
    this.tableHeader = tableHeader;

    this.placeholderElement.textContent = msg("timing-no-timers");
  }

  getRowValues(timer) {
    const rowValues = {
      label: timer.label,
      totalTime: timer.totalTime.toFixed(1),
      avgTime: (timer.totalTime / timer.callCount).toFixed(2),
      percent: this.config.showRatioTime
        ? (timer.totalTime / this.minTimerTime).toFixed(1)
        : ((100 * timer.totalTime) / this.totalTimerTime).toFixed(2),
      callCount: timer.callCount,
    };
    return rowValues;
  }

  generateRow(timer) {
    const root = document.createElement("div");
    root.className = "sa-timing-timer";

    let labelElem = null;
    if (timer.targetId !== null && timer.blockId !== null) {
      const preview = this.debug.createBlockPreview(timer.targetId, timer.blockId);
      labelElem = this.debug.createBlockLink(this.debug.getTargetInfoById(timer.targetId), timer.blockId);
      if (preview !== null) {
        labelElem.className = preview.className;
        labelElem.textContent = `${timer.idx}: ${preview.textContent}`;
        labelElem.setAttribute("data-shape", preview.getAttribute("data-shape"));
      }
      if (timer.label !== timer.blockId) {
        labelElem.textContent = timer.label;
      }
    } else {
      labelElem = createInfoElement(timer.label);
    }

    const { totalTime, avgTime, percent, callCount} = this.getRowValues(timer);
    const perSymbol = this.config.showRatioTime ? "" : "%";
    const formattedValues = [
      `${totalTime} ms`,
      `${avgTime} ms`,
      `${percent} ${perSymbol}`,
      callCount
    ];
    const elements = [labelElem, ...formattedValues.map((v) => createInfoElement(v))];
    elements.forEach((elem) => root.appendChild(elem));
    return { root, ...elements };
  }

  updateLogRows(timers, showLineByLine) {
    this.tableHeader.style.display = Object.keys(timers).length === 0 ? "none" : "flex";
    this.rows = Object.entries(timers).map(([label, value]) => ({ label, ...value }));
    this.rows = this.rows.filter((timer) =>
      showLineByLine ? timer.label === timer.blockId : timer.label !== timer.blockId
    );
    if (this.sortHeader !== "null") this.sortRows();
    this.totalTimerTime = this.getTotalTime();
    this.minTimerTime = timers["control"]
      ? timers["control"].totalTime
      : Math.min(...this.rows.map((t) => t.totalTime));
    if (this.minTimerTime === 0) this.minTimerTime = 0.1;
    this.queueUpdateContent();
  }

  sortRows() {
    const { sortDirection, sortHeader } = this.config;
    this.rows = this.rows.map((row) => ({
      ...row,
      avgTime: row.totalTime / row.callCount
    }));
    this.rows.sort((a, b) => (sortDirection === "ascending" ? 1 : -1) * (a[sortHeader] - b[sortHeader]));
  }

  getTotalTime() {
    return Object.values(this.rows).reduce((total, row) => total + row.totalTime, 0);
  }
}

export default TableRows;
