export default async function ({ addon, global, console, msg }) {
  console.log("clones counter enabled");

  const vm = addon.tab.traps.onceValues.vm;

  vm.runtime.__cloneCounter = vm.runtime._cloneCounter;

  Object.defineProperty(vm.runtime, "_cloneCounter", {
    get: function () {
      return this.__cloneCounter;
    },
    set: function (v) {
      doCloneChecks(v);
      return (this.__cloneCounter = v);
    },
  });

  hideInSmallStageMode({ addon });

  var countContainerContainer = document.createElement("div");
  var countContainer = document.createElement("div");
  var count = document.createElement("span");
  var icon = document.createElement("img");

  countContainerContainer.className = "clone-container-container";
  countContainer.className = "clone-container";
  icon.className = "clone-icon";

  countContainerContainer.appendChild(icon);
  countContainerContainer.appendChild(countContainer);
  countContainer.appendChild(count);

  function doCloneChecks(v) {
    if (v <= 0) {
      countContainerContainer.style.display = "none";
    } else {
      countContainerContainer.style.display = "";
    }

    if (v == 300) {
      count.style.color = "#ff6680";
      icon.src = addon.self.dir + "/300cats.svg";
    } else {
      count.style.color = "";
      icon.src = addon.self.dir + "/cat.svg";
    }
    count.innerText = msg("clones", { cloneCount: v });
  }

  while (true) {
    let bar = await addon.tab.waitForElement("[class^='controls_controls-container']", { markAsSeen: true });

    if (addon.tab.editorMode === "editor") {
      doCloneChecks(vm.runtime._cloneCounter);

      icon.src = addon.self.dir + "/cat.svg";

      bar.appendChild(countContainerContainer);
    }
  }
}

async function hideInSmallStageMode({ addon }) {
  while (true) {
    await addon.tab.waitForElement(".stage-header_stage-size-toggle-group_17LtK", { markAsSeen: true });

    document.querySelector(".stage-header_stage-button-first_y_CLF").addEventListener("click", () => {
      document.querySelector(".clone-container-container").style.display = "none";
    });
    document.querySelector(".stage-header_stage-button-last_eeKZ4").addEventListener("click", () => {
      document.querySelector(".clone-container-container").style.display = "";
    });
  }
}
