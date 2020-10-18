export default async function ({ addon, global, console }) {
  console.log("clones counter enabled");

  const vm = addon.tab.traps.onceValues.vm;

  while (true) {
    let bar = await addon.tab.waitForElement(".controls_controls-container_2xinB", { markAsSeen: true });

    if (document.location.href.split("/")[5] == "editor") {
      // my attempt at detecting if they're in the editor?
      var countContainerContainer = document.createElement("div");
      var countContainer = document.createElement("div");
      var count = document.createElement("span");
      var icon = document.createElement("img");

      countContainerContainer.className = "clone-container-container";
      countContainer.className = "clone-container";
      icon.className = "clone-icon";

      count.innerText = "clones: " + vm.runtime._cloneCounter;
      icon.src = addon.self.dir + "/cat.svg";

      countContainerContainer.appendChild(icon);
      countContainerContainer.appendChild(countContainer);
      countContainer.appendChild(count);

      bar.appendChild(countContainerContainer);

      vm.runtime.__cloneCounter = vm.runtime._cloneCounter;

      Object.defineProperty(vm.runtime, "_cloneCounter", {
        get: function () {
          return this.__cloneCounter;
        },
        set: function (v) {
          console.log("set");
          count.innerText = "clones: " + v;
          return (this.__cloneCounter = v);
        },
      });
    }
  }
}
