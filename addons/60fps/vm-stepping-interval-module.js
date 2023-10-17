const DEFAULT_FPS = 30;
let interval = 1000 / DEFAULT_FPS;
let intervalOwner = window; // Defaults to main window object
let lastInterval = { owner: null, intervalId: null };

let polluted = false;
export function polluteRuntimeStart(vm) {
  if (polluted) return;
  polluted = true;

  vm.runtime.start = function () {
    if (this._steppingInterval) return;
    this.currentStepTime = interval;
    this._steppingInterval = intervalOwner.setInterval(() => {
      this._step();
    }, interval);
    this.emit("RUNTIME_STARTED");

    lastInterval = { owner: intervalOwner, intervalId: this._steppingInterval};
  };
}

export function getIntervalOwner() {
  return intervalOwner;
}
export function setIntervalOwner(windowObj) {
  intervalOwner = windowObj;
}

export function setVmIntervalDelay(newInterval) {
  interval = newInterval;
}

export function restartStepInterval(vm) {
  lastInterval.owner.clearInterval(lastInterval.intervalId);
  vm.runtime._steppingInterval = null;
  vm.runtime.start();
}
