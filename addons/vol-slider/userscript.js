import { setup, setVol, getDefVol, setDefVol } from "./module.js";

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

  document.addEventListener("click", (e) => {
      if (e.target.closest("[class*='stage-header_stage-button-first']")) {
        container.style.display = "none";
      } else if (e.target.closest("[class*='stage-header_stage-button-last']")) {
        container.style.display = "inline-block";
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
  
  slider.addEventListener("input", function (e) {
    setVol(this.value);
  });

  while (true) {
    await addon.tab.waitForElement("[class^='green-flag_green-flag']", {
      markAsSeen: true,
      reduxEvents: ["scratch-gui/mode/SET_PLAYER", "fontsLoaded/SET_FONTS_LOADED", "scratch-gui/locales/SELECT_LOCALE"],
    });
    addon.tab.displayNoneWhileDisabled(container, { display: "inline-block" });
    addon.tab.appendToSharedSpace({ space: "afterStopButton", element: container, order: 0 });
    container.appendChild(icon);
    container.appendChild(slider);
    setup(vm);
    setDefVol(addon.settings.get("defVol") / 100);
    setVol(getDefVol());
  }
}
