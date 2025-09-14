class TimingManager {
  constructor(settings, config, profiler) {
    this.dummyProfiler = profiler;
    this.settings = settings;
    this.config = config;

    this.timers = Object.create(null);
    this.lastTimerLabel = null;
    this.heatmapManager = null; // Will be set by createTimingTab.js
  }

  startTimer(label, targetId = null, blockId = null) {
    // Use a default key for empty labels
    const isEmptyLabel = label === "";
    if (isEmptyLabel) {
      label = "__empty_timer__";
    }

    if (label !== blockId && this.lastTimerLabel !== null && this.settings.get("auto_stop_timing")) {
      this.stopTimer(this.lastTimerLabel);
      this.lastTimerLabel = null;
    }

    const currentTime = performance.now();
    if (this.timers[label]) {
      this.timers[label].startTime = currentTime;
      this.timers[label].callCount += 1;
      this.timers[label].isActive = true;
      // Update display label in case it wasn't stored before
      if (this.timers[label].displayLabel === undefined) {
        this.timers[label].displayLabel = isEmptyLabel ? "" : label;
      }
    } else {
      this.timers[label] = {
        startTime: currentTime,
        totalTime: 0,
        callCount: 1,
        targetId: targetId,
        blockId: blockId,
        idx: Object.keys(this.timers).length,
        isActive: true,
        displayLabel: isEmptyLabel ? "" : label, // Store the original label for display purposes
      };
    }

    // Notify heatmap manager of timer modification for real-time updates
    if (this.heatmapManager && blockId) {
      this.heatmapManager.markTimerModified(blockId);
    }

    if (label !== blockId) this.lastTimerLabel = label;
  }

  stopTimer(label) {
    // Use the same default key for empty labels
    if (label === "") {
      label = "__empty_timer__";
    }
    const currentTime = performance.now();
    if (this.timers[label] && this.timers[label].isActive) {
      this.timers[label].totalTime += currentTime - this.timers[label].startTime;
      this.timers[label].isActive = false;

      // Notify heatmap manager of timer modification for real-time updates
      if (this.heatmapManager && this.timers[label].blockId) {
        this.heatmapManager.markTimerModified(this.timers[label].blockId);
      }
    }
    if (label === this.lastTimerLabel) this.lastTimerLabel = null;
  }

  clearTimers() {
    this.timers = Object.create(null);
  }

  getTimers() {
    return this.timers;
  }
}

export default TimingManager;
