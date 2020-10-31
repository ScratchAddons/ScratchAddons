export default async function ({ addon, global, console }) {
  console.log("pause enabled");

  const vm = addon.tab.traps.onceValues.vm;

  var playing = true
  var threads = []

  while (true) {
    let bar = await addon.tab.waitForElement("[class^='controls_controls-container']", { markAsSeen: true });

    var img = document.createElement('img')
    img.className = 'pause-btn'
    if (playing) img.src = addon.self.dir + "/pause.svg"
    if (!playing) img.src = addon.self.dir + "/play.svg"
    img.draggable = false
    img.title = 'Pause'

    document.querySelector("[class^='green-flag']").insertAdjacentElement("afterend", img)

    img.addEventListener('click', e => {
      if (!playing) {
        if (vm.runtime.threads.length == 0) vm.runtime.threads = threads
        vm.runtime.audioEngine.audioContext.resume()
        vm.runtime.ioDevices.clock.resume()
        img.src = addon.self.dir + "/pause.svg"
      } else {
        threads = vm.runtime.threads
        vm.runtime.threads = []
        vm.runtime.audioEngine.audioContext.suspend()
        vm.runtime.ioDevices.clock.pause()
        img.src = addon.self.dir + "/play.svg"
      }
      playing = !playing
    })

    document.querySelector("[class^='green-flag']").addEventListener('click', e => { //just incase someone presses greenflag after it has been pauseds
      threads = []
      vm.runtime.audioEngine.audioContext.resume()
      vm.runtime.ioDevices.clock.resume()
      img.src = addon.self.dir + "/pause.svg"
      playing = true
    })


    //TODO: break points in scratch code
    //eg. when gf clicked, move 10 steps, set sa_Breakpoint = true or something like that, then when that scratch variable is set to true, pause the project
  }
}
