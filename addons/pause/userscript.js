export default async function ({ addon, global, console }) {
  console.log("pause enabled");

  const vm = addon.tab.traps.onceValues.vm;

  var playing = true;
  var threads = [];

  const oldStepToProcedure = vm.runtime.sequencer.stepToProcedure;

  vm.runtime.sequencer.stepToProcedure = function (thread, proccode) {
    if (proccode.startsWith("sa-pause")) {
      threads = vm.runtime.threads;
      vm.runtime.threads.forEach((i) => {
        i.status = 3;
      });
      vm.runtime.threads = [];
      vm.runtime.audioEngine.audioContext.suspend();
      vm.runtime.ioDevices.clock.pause();
      playing = false;
      document.querySelector(".pause-btn").src = addon.self.dir + "/play.svg";
      return;
    }
    return oldStepToProcedure.call(this, thread, proccode);
  };

  const oldFlag = vm.runtime.greenFlag;

  vm.runtime.greenFlag = function () {
    vm.runtime.audioEngine.audioContext.resume().then(() => {
      vm.runtime.ioDevices.clock.resume();
      img.src = addon.self.dir + "/pause.svg";
      playing = true;
      return oldFlag.call(vm.runtime, arguments);
    });
  };

  while (true) {
    let bar = await addon.tab.waitForElement("[class^='controls_controls-container']", { markAsSeen: true });

    var img = document.createElement("img");
    img.className = "pause-btn";
    if (playing) img.src = addon.self.dir + "/pause.svg";
    if (!playing) img.src = addon.self.dir + "/play.svg";
    img.draggable = false;
    img.title = "Pause";

    document.querySelector("[class^='green-flag']").insertAdjacentElement("afterend", img);

    img.addEventListener("click", (e) => {
      if (!playing) {
        vm.runtime.audioEngine.audioContext.resume().then(() => {
          if (vm.runtime.threads.length == 0) vm.runtime.threads = threads;
          vm.runtime.ioDevices.clock.resume();
          img.src = addon.self.dir + "/pause.svg";
        });
      } else {
        vm.runtime.audioEngine.audioContext.suspend().then(() => {
          threads = vm.runtime.threads;
          vm.runtime.threads = [];
          vm.runtime.ioDevices.clock.pause();
          img.src = addon.self.dir + "/play.svg";
        });
      }
      playing = !playing;
    });

    //TODO: break points in scratch code
    //eg. when gf clicked, move 10 steps, set sa_Breakpoint = true or something like that, then when that scratch variable is set to true, pause the project
  }
}
