class TimingManager {
  constructor(settings, config) {
    this.timers = {};
    this.lastTimerLabel = null;
    this.dummyProfiler = null;
    this.settings = settings
    this.config = config
  }

  startTimer(label, targetId = null, blockId = null) {
    if (label == '') return;

    if (label !== blockId && this.lastTimerLabel !== null && this.settings.get("auto_stop_timing")) {
      this.stopTimer(this.lastTimerLabel);
      this.lastTimerLabel = null;
    }

    const currentTime = performance.now();
    if (this.timers[label]) {
      this.timers[label].startTime = currentTime;
      this.timers[label].startRTC = this.dummyProfiler.totalRTC;
      this.timers[label].callCount += 1;
    } else {
      this.timers[label] = {
        startTime: currentTime,
        totalTime: 0,
        callCount: 1,
        targetId: targetId,
        blockId: blockId,
        idx: Object.keys(this.timers).length,
        startRTC: this.dummyProfiler.totalRTC,
        totalRTC: 0,
      };
    }
    if (label !== blockId) this.lastTimerLabel = label;
  }

  stopTimer(label) {
    const currentTime = performance.now();
    if (this.timers[label]) {
      this.timers[label].totalTime += currentTime - this.timers[label].startTime;
      if (this.config.showRTC) {
        let rtcDifference = this.dummyProfiler.totalRTC - this.timers[label].startRTC;
        const rtcProc = this.dummyProfiler.rtcTable['procedures_call']
        rtcDifference -= label !== this.timers[label].blockId ? rtcProc : 0;
        this.timers[label].totalRTC += rtcDifference;
      }
    }
    if (label === this.lastTimerLabel) this.lastTimerLabel = null;
  }

  clearTimers() {
    this.timers = {};
  }

  getTimers() {
    return this.timers;
  }
}

export default TimingManager;
