class TimingManager {
  constructor(settings, config, profiler) {
    this.dummyProfiler = profiler;
    this.settings = settings;
    this.config = config;

    this.timers = Object.create(null);
    this.lastTimerLabel = null;
  }

  startTimer(label, targetId = null, blockId = null) {
    if (label == "") return;

    if (label !== blockId && this.lastTimerLabel !== null && this.settings.get("auto_stop_timing")) {
      this.stopTimer(this.lastTimerLabel);
      this.lastTimerLabel = null;
    }

    const currentTime = performance.now();
    if (this.timers[label]) {
      this.timers[label].startTime = currentTime;
      this.timers[label].callCount += 1;
      this.timers[label].isActive = true;
    } else {
      this.timers[label] = {
        startTime: currentTime,
        totalTime: 0,
        callCount: 1,
        targetId: targetId,
        blockId: blockId,
        idx: Object.keys(this.timers).length,
        isActive: true,
      };
    }
    if (label !== blockId) this.lastTimerLabel = label;
  }

  stopTimer(label) {
    const currentTime = performance.now();
    if (this.timers[label] && this.timers[label].isActive) {
      this.timers[label].totalTime += currentTime - this.timers[label].startTime;
      this.timers[label].isActive = false;
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
