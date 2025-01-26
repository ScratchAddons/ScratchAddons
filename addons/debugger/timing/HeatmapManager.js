function valueToHeatmapColor(value, min = 0, max = 1) {
  const clampedValue = Math.max(min, Math.min(max, value));
  const normalizedValue = (clampedValue - min) / (max - min);
  const r = Math.round(255 * normalizedValue);
  const b = Math.round(255 * (1 - normalizedValue));
  return `#${((1 << 24) | (r << 16) | b).toString(16).slice(1).toUpperCase()}`;
}

function recursiveFillBlock(block, fill = null) {
  const fillColor = fill === null ? block.colour_ : fill;
  block.svgPath_.style.fill = fillColor;

  if (block.childBlocks_) {
    block.childBlocks_.forEach((child) => {
      if (child.previousConnection === null) {
        recursiveFillBlock(child, fill);
      }
    });
  }

  block.inputList.forEach((input) => {
    input.fieldRow.forEach((field) => {
      if (field.box_) field.box_.style.fill = fill;
    });
  });
}

class HeatmapManager {
  constructor(getWorkspace, tableRows) {
    this.getWorkspace = getWorkspace;
    this.tableRows = tableRows;
  }

  showHeatmapFn(heatmapMax) {
    const totalTimerTime = this.tableRows.getTotalTime();
    const timerPercentTimes = this.tableRows.rows.map((t) => t.totalTime / totalTimerTime);
    const min = Math.min(...timerPercentTimes);
    const max = Math.max(...timerPercentTimes) * heatmapMax;

    this.updateBlocks((block, timer) => {
      recursiveFillBlock(block, valueToHeatmapColor(timer.totalTime / totalTimerTime, min, max));
    });
  }

  hideHeatmapFn() {
    this.updateBlocks((block) => recursiveFillBlock(block));
  }

  updateBlocks(fillFn) {
    const workspace = this.getWorkspace();
    this.tableRows.rows.forEach((timer) => {
      const block = workspace.blockDB_[timer.blockId];
      if (block) fillFn(block, timer);
    });
  }
}

export default HeatmapManager;
