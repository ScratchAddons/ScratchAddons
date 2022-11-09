import { setup, setVol, getDefVol, setDefVol, isMuted } from "./module.js";

export default async function ({ addon, global, console }) {
  const vm = addon.tab.traps.vm;
  let icon = document.createElement("img");
  icon.loading = "lazy";
  icon.id = "sa-vol-icon";
  let slider = document.createElement("input");
  slider.id = "sa-vol-slider";
  slider.type = "range";
  slider.min = 0;
  slider.max = 1;
  slider.step = 0.02;
  const container = document.createElement("div");
  container.className = "sa-volume";

  if (addon.tab.redux.state && addon.tab.redux.state.scratchGui.stageSize.stageSize === "small") {
    document.body.classList.add("sa-vol-slider-small");
  }
  document.addEventListener(
    "click",
    (e) => {
      if (e.target.closest("[class*='stage-header_stage-button-first']")) {
        document.body.classList.add("sa-vol-slider-small");
      } else if (e.target.closest("[class*='stage-header_stage-button-last']")) {
        document.body.classList.remove("sa-vol-slider-small");
      }
    },
    { capture: true }
  );

  addon.self.addEventListener("disabled", () => {
    setVol(1);
  });

  addon.self.addEventListener("reenabled", () => {
    setVol(getDefVol());
  });

  addon.settings.addEventListener("change", () => {
    setDefVol(addon.settings.get("defVol") / 100);
  });

  icon.addEventListener("click", function (e) {
    // Same logic as mute-project
    if (isMuted()) {
      setVol(getDefVol());
    } else {
      setVol(0);
    }
  });
  slider.addEventListener("input", function (e) {
    setVol(this.value);
  });
  
  let i = 0;
  while (true) {
    await addon.tab.waitForElement("[class^='green-flag_green-flag']", {
      markAsSeen: true,
      reduxEvents: ["scratch-gui/mode/SET_PLAYER", "fontsLoaded/SET_FONTS_LOADED", "scratch-gui/locales/SELECT_LOCALE"],
    });
    addon.tab.displayNoneWhileDisabled(container, { display: "inline-block" });
    addon.tab.appendToSharedSpace({ space: "afterStopButton", element: container, order: 0 });
    container.appendChild(icon);
    container.appendChild(slider);
    if (i < 1) {
      setup(vm);
      setDefVol(addon.settings.get("defVol") / 100);
      setVol(getDefVol());
    }
    i++;
  }
}
