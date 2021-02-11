export default async function ({ addon, global, console, msg }) {
  const vm = addon.tab.traps.vm;

  const img = document.createElement('img');
  img.className = "pause-btn";
  img.src = addon.self.dir + "/pause.svg";
  img.draggable = false;
  img.title = msg("pause");
  img.addEventListener("click", () => setPaused(!paused));

  let paused = false;
  let pauseTime;

  const setPaused = (_paused) => {
    paused = _paused;

    if (paused) {
      pauseTime = vm.runtime.currentMSecs;
      vm.runtime.audioEngine.audioContext.suspend();
      vm.runtime.ioDevices.clock.pause();
      img.src = addon.self.dir + "/play.svg";
    } else {
      vm.runtime.audioEngine.audioContext.resume();
      vm.runtime.ioDevices.clock.resume();
      img.src = addon.self.dir + "/pause.svg";

      const dt = Date.now() - pauseTime;
      for (const thread of vm.runtime.threads) {
        const stackFrame = thread.peekStackFrame();
        if (stackFrame && stackFrame.executionContext && stackFrame.executionContext.timer) {
          stackFrame.executionContext.timer.startTime += dt;
        }
      }
    }
  };

  const originalStep = vm.runtime._step;
  vm.runtime._step = function() {
    if (paused) {
      return;
    }
    return originalStep.call(this);
  };

  const originalStepToProcedure = vm.runtime.sequencer.stepToProcedure;
  vm.runtime.sequencer.stepToProcedure = function (thread, proccode) {
    if (proccode.startsWith("sa-pause")) {
      setPaused(true);
      return;
    }
    return originalStepToProcedure.call(this, thread, proccode);
  };

  const oldFlag = vm.runtime.greenFlag;
  vm.runtime.greenFlag = function () {
    setPaused(false);
    return oldFlag.call(this);
  };

  while (true) {
    await addon.tab.waitForElement("[class^='controls_controls-container']", { markAsSeen: true });
    document.querySelector("[class^='green-flag']").insertAdjacentElement("afterend", img);
  }
}
