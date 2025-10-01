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
    let displayLabel = timer.displayLabel !== undefined ? timer.displayLabel : timer.label;
    // Ensure empty labels have height by using a non-breaking space
    if (displayLabel === "") {
      displayLabel = "\u00A0"; // non-breaking space
    }

    // For line-by-line timers (where label === blockId), use the human-readable block text
    if (timer.label === timer.blockId && timer.targetId !== null && timer.blockId !== null) {
      const preview = this.debug.createBlockPreview(timer.targetId, timer.blockId);
      if (preview !== null) {
        displayLabel = `${timer.idx}: ${preview.textContent}`;
      }
    }

    const rowValues = {
      label: displayLabel,
      totalTime: timer.totalTime.toFixed(1),
      avgTime: (timer.totalTime / timer.callCount).toFixed(2),
      percent: this.config.showRatioTime
        ? this.minTimerTime === 0 && timer.totalTime === 0
          ? "1.0"
          : (timer.totalTime / this.minTimerTime).toFixed(1)
        : this.totalTimerTime === 0 && timer.totalTime === 0
          ? "100.00"
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
        const { label } = this.getRowValues(timer);
        labelElem.textContent = label;
      }
    } else {
      const { label } = this.getRowValues(timer);
      labelElem = createInfoElement(label);
    }

    const { totalTime, avgTime, percent, callCount } = this.getRowValues(timer);
    const perSymbol = this.config.showRatioTime ? "" : "%";
    const formattedValues = [`${totalTime} ms`, `${avgTime} ms`, `${percent} ${perSymbol}`, callCount];
    const elements = [labelElem, ...formattedValues.map((v) => createInfoElement(v))];
    elements.forEach((elem) => root.appendChild(elem));
    return { root, ...elements };
  }

  updateLogRows(timers, showLineByLine) {
    this.rows = Object.entries(timers).map(([label, value]) => ({ label, ...value }));
    // Always show timers, optionally add line-by-line data
    this.rows = this.rows.filter((timer) => {
      const isLineByLine = timer.label === timer.blockId;
      const isTimer = timer.label !== timer.blockId;
      return isTimer || (showLineByLine && isLineByLine);
    });
    this.tableHeader.style.display = this.rows.length === 0 ? "none" : "flex";
    if (this.sortHeader !== "null") this.sortRows();
    this.totalTimerTime = this.getTotalTime(showLineByLine);
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
      avgTime: row.totalTime / row.callCount,
    }));
    this.rows.sort((a, b) => (sortDirection === "ascending" ? 1 : -1) * (a[sortHeader] - b[sortHeader]));
  }

  getTotalTime(showLineByLine = false) {
    // First check if we have any line-by-line data when profiling is enabled
    const hasLineByLineData = showLineByLine && this.rows.some((row) => row.label === row.blockId);

    return Object.values(this.rows).reduce((total, row) => {
      const isLineByLine = row.label === row.blockId;
      const isTimer = row.label !== row.blockId;

      // If profiling is enabled and we have line-by-line data, only include line-by-line data
      // If profiling is enabled but no line-by-line data exists, fall back to timer data
      // If profiling is disabled, only include timer data
      if (hasLineByLineData && isLineByLine) {
        return total + row.totalTime;
      } else if ((!showLineByLine || !hasLineByLineData) && isTimer) {
        return total + row.totalTime;
      }
      return total;
    }, 0);
  }
}

export default TableRows;
