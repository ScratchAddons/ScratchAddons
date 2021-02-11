export default async function ({ addon, global, console, msg }) {
  const vm = addon.tab.traps.vm;

  const isMonitorThread = (thread) => !!thread.updateMonitor;

  const img = document.createElement("img");
  img.className = "pause-btn";
  img.src = addon.self.dir + "/pause.svg";
  img.draggable = false;
  img.title = msg("pause");
  img.addEventListener("click", () => setPaused(!paused));

  let paused = false;
  let pausedThreadState = new Map();
  const edgeActivatedHats = new Set();

  const setPaused = (_paused) => {
    const oldPaused = paused;
    paused = _paused;

    if (paused) {
      vm.runtime.audioEngine.audioContext.suspend();
      if (!oldPaused) {
        vm.runtime.ioDevices.clock.pause();
      }
      img.src = addon.self.dir + "/play.svg";

      for (const thread of vm.runtime.threads) {
        if (!isMonitorThread(thread) && !pausedThreadState.has(thread)) {
          pausedThreadState.set(thread, {
            pauseTime: vm.runtime.currentMSecs,
            status: thread.status
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

      for (const thread of vm.runtime.threads) {
        const stackFrame = thread.peekStackFrame();
        const pausedState = pausedThreadState.get(thread);
        if (pausedState) {
          if (stackFrame && stackFrame.executionContext && stackFrame.executionContext.timer) {
            const dt = Date.now() - pausedState.pauseTime;
            stackFrame.executionContext.timer.startTime += dt;
          }
          thread.status = pausedState.status;
        }
      }
      pausedThreadState.clear();

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

  const originalEmitProjectRunStatus = vm.runtime._emitProjectRunStatus;
  vm.runtime._emitProjectRunStatus = function (threadCount) {
    threadCount -= pausedThreadState.size;
    return originalEmitProjectRunStatus.call(this, threadCount);
  };

  while (true) {
    const flag = await addon.tab.waitForElement("[class^='green-flag']", { markAsSeen: true });
    flag.insertAdjacentElement("afterend", img);
  }
}
