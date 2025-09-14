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

  // Set text color for blocks with heatmap applied
 const textElements = Array.from(block.svgGroup_.children)
  .filter(el => !el.classList.contains('blocklyDraggable'))
  .flatMap(el => Array.from(el.querySelectorAll("text")));

  if (fill !== null) {
    // Heatmap is being applied - force white text
    textElements.forEach((textEl) => {
      textEl.style.setProperty("fill", "white", "important");
    });
  } else {
    // Heatmap is being removed - remove our inline styles
    textElements.forEach((textEl) => {
      textEl.style.removeProperty("fill");
    });
  }

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
  constructor(getWorkspace, tableRows, config) {
    this.getWorkspace = getWorkspace;
    this.tableRows = tableRows;
    this.config = config;
    this.coloredBlocks = new Set(); // Track all blocks that have been colored
  }

  showHeatmapFn(heatmapMax) {
    const totalTimerTime = this.tableRows.getTotalTime(this.config.showLineByLine);
    const timerPercentTimes = this.tableRows.rows.map((t) => t.totalTime / totalTimerTime);
    const min = Math.min(...timerPercentTimes);
    const max = Math.max(...timerPercentTimes) * heatmapMax;

    this.updateBlocks((block, timer) => {
      recursiveFillBlock(block, valueToHeatmapColor(timer.totalTime / totalTimerTime, min, max));
      this.coloredBlocks.add(timer.blockId); // Track this block as colored
    });
  }

  hideHeatmapFn() {
    // Reset all previously colored blocks, not just current timer blocks
    const workspace = this.getWorkspace();
    this.coloredBlocks.forEach((blockId) => {
      const block = workspace.blockDB_[blockId];
      if (block) {
        recursiveFillBlock(block);
      }
    });
    // Also reset any current timer blocks
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
