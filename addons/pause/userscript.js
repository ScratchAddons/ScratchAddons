export default async function ({ addon, global, console, msg }) {
  const vm = addon.tab.traps.vm;

  const img = document.createElement("img");
  img.className = "pause-btn";
  img.src = addon.self.dir + "/pause.svg";
  img.draggable = false;
  img.title = msg("pause");
  img.addEventListener("click", () => setPaused(!paused));

  let paused = false;
  let pausedThreadState = new WeakMap();
  const edgeActivatedHats = new Set();

  const setPaused = (_paused) => {
    paused = _paused;

    if (paused) {
      vm.runtime.audioEngine.audioContext.suspend();
      if (!vm.runtime.ioDevices.clock._paused) {
        vm.runtime.ioDevices.clock.pause();
      }
      img.src = addon.self.dir + "/play.svg";

      for (const thread of vm.runtime.threads) {
        if (
          !thread.updateMonitor &&
          thread.status !== /* STATUS_DONE */ 4 &&
          !thread.isKilled &&
          !pausedThreadState.has(thread)
        ) {
          pausedThreadState.set(thread, {
            pauseTime: vm.runtime.currentMSecs,
            status: thread.status,
          });
          thread.status = /* STATUS_PROMISE_WAIT */ 1;
        }
      }

      for (const hat of Object.keys(vm.runtime._hats)) {
        if (vm.runtime._hats[hat].edgeActivated) {
          edgeActivatedHats.add(hat);
          vm.runtime._hats[hat].edgeActivated = false;
        }
      }
    } else {
      vm.runtime.audioEngine.audioContext.resume();
      vm.runtime.ioDevices.clock.resume();
      img.src = addon.self.dir + "/pause.svg";

      const now = Date.now();
      for (const thread of vm.runtime.threads) {
        const stackFrame = thread.peekStackFrame();
        const pausedState = pausedThreadState.get(thread);
        if (pausedState) {
          if (stackFrame && stackFrame.executionContext && stackFrame.executionContext.timer) {
            const dt = now - pausedState.pauseTime;
            stackFrame.executionContext.timer.startTime += dt;
          }
          thread.status = pausedState.status;
        }
      }
      pausedThreadState = new WeakMap();

      for (const hat of Object.keys(vm.runtime._hats)) {
        if (edgeActivatedHats.has(hat)) {
          vm.runtime._hats[hat].edgeActivated = true;
        }
      }
    }
  };

  const originalStepToProcedure = vm.runtime.sequencer.stepToProcedure;
  vm.runtime.sequencer.stepToProcedure = function (thread, proccode) {
    if (proccode.startsWith("sa-pause")) {
      setPaused(true);
      return;
    }
    return originalStepToProcedure.call(this, thread, proccode);
  };

  const originalGreenFlag = vm.runtime.greenFlag;
  vm.runtime.greenFlag = function () {
    setPaused(false);
    return originalGreenFlag.call(this);
  };

  const originalActivateClickhats = vm.runtime.ioDevices.mouse._activateClickHats;
  vm.runtime.ioDevices.mouse._activateClickHats = function (target) {
    if (!paused) {
      return originalActivateClickhats.call(this, target);
    }
  };

  const originalPostData = vm.runtime.ioDevices.keyboard.postData;
  vm.runtime.ioDevices.keyboard.postData = function (data) {
    if (paused) {
      const originalEmit = this.runtime.emit;
      this.runtime.emit = () => {}; // no-op
      const r = originalPostData.call(this, data);
      this.runtime.emit = originalEmit;
      return r;
    }
    return originalPostData.call(this, data);
  };

  // Fix project running/stopped state
  const originalGetMonitorThreadCount = vm.runtime._getMonitorThreadCount;
  vm.runtime._getMonitorThreadCount = function (threads) {
    let count = originalGetMonitorThreadCount.call(this, threads);
    if (paused) {
      for (const thread of threads) {
        if (pausedThreadState.has(thread)) {
          count++;
        }
      }
    }
    return count;
  };

  while (true) {
    const flag = await addon.tab.waitForElement("[class^='green-flag']", { markAsSeen: true });
    flag.insertAdjacentElement("afterend", img);
  }
}
