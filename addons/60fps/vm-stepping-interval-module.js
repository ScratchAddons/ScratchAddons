const DEFAULT_FPS = 30;
let interval = 1000 / DEFAULT_FPS;

let polluted = false;
export function polluteRuntimeStart(vm) {
  if (polluted) return;
  polluted = true;

  vm.runtime.start = function () {
    if (this._steppingInterval) return;
    this.currentStepTime = interval;
    this._steppingInterval = setInterval(() => {
      this._step();
    }, interval);
    this.emit("RUNTIME_STARTED");
  };
}

export function setVmIntervalDelay(newInterval) {
  interval = newInterval;
}

export function restartStepInterval(vm) {
  clearInterval(vm.runtime._steppingInterval);
  vm.runtime._steppingInterval = null;
  vm.runtime.start();
}
