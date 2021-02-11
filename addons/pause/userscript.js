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
  let pauseTime;
  let oldThreadStatus = new WeakMap();

  const setPaused = (_paused) => {
    paused = _paused;

    if (paused) {
      pauseTime = vm.runtime.currentMSecs;
      vm.runtime.audioEngine.audioContext.suspend();
      vm.runtime.ioDevices.clock.pause();
      img.src = addon.self.dir + "/play.svg";

      oldThreadStatus = new WeakMap();
      for (const thread of vm.runtime.threads) {
        if (!isMonitorThread(thread)) {
          oldThreadStatus.set(thread, thread.status);
          thread.status = /* STATUS_PROMISE_WAIT */ 1;
        }
      }
    } else {
      vm.runtime.audioEngine.audioContext.resume();
      vm.runtime.ioDevices.clock.resume();
      img.src = addon.self.dir + "/pause.svg";

      const dt = Date.now() - pauseTime;
      for (const thread of vm.runtime.threads) {
        const stackFrame = thread.peekStackFrame();
        if (oldThreadStatus.has(thread)) {
          if (stackFrame && stackFrame.executionContext && stackFrame.executionContext.timer) {
            stackFrame.executionContext.timer.startTime += dt;
          }
          thread.status = oldThreadStatus.get(thread);
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

  while (true) {
    const flag = await addon.tab.waitForElement("[class^='green-flag']", { markAsSeen: true });
    flag.insertAdjacentElement("afterend", img);
  }
}
