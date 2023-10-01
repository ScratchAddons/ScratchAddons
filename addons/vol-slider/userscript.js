import { setup, setVolume, onVolumeChanged, getVolume, setMuted, setUnmutedVolume, isMuted } from "./module.js";

export default async function ({ addon, console }) {
  const vm = addon.tab.traps.vm;
  setup(vm);

  const icon = document.createElement("div");
  icon.className = "sa-vol-slider-icon";
  icon.addEventListener("click", () => {
    setMuted(!isMuted());
  });

  const updateIcon = () => {
    const newVolume = getVolume();
    if (newVolume == 0) {
      icon.dataset.icon = "mute";
    } else if (newVolume < 0.5) {
      icon.dataset.icon = "quiet";
    } else {
      icon.dataset.icon = "loud";
    }
  };
  onVolumeChanged(updateIcon);

  const slider = document.createElement("input");
  slider.className = "sa-vol-slider-input";
  slider.type = "range";
  slider.min = 0;
  slider.max = 1;
  slider.step = 0.02;
  slider.addEventListener("input", (e) => {
    setVolume(+e.target.value);
  });
  slider.addEventListener("change", (e) => {
    // Only commit unmute volume after the user finishes moving the slider
    if (!isMuted()) {
      setUnmutedVolume(getVolume());
    }
  });

  onVolumeChanged(() => {
    const newVolume = getVolume();
    if (newVolume !== +slider.value) {
      slider.value = newVolume;
    }
  });
  setVolume(addon.settings.get("defVol") / 100);

  const container = document.createElement("div");
  container.className = "sa-vol-slider";
  container.appendChild(icon);
  container.appendChild(slider);
  addon.tab.displayNoneWhileDisabled(container, {
    display: "flex",
  });

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
    setVolume(1);
  });

  addon.self.addEventListener("reenabled", () => {
    setVolume(addon.settings.get("defVol") / 100);
  });

  while (true) {
    await addon.tab.waitForElement("[class^='green-flag_green-flag']", {
      markAsSeen: true,
      reduxEvents: ["scratch-gui/mode/SET_PLAYER", "fontsLoaded/SET_FONTS_LOADED", "scratch-gui/locales/SELECT_LOCALE"],
    });
    addon.tab.displayNoneWhileDisabled(container, { display: "flex" });
    addon.tab.appendToSharedSpace({ space: "afterStopButton", element: container, order: 0 });
  }
}
