import { setup, isMuted, onVolumeChanged, setMuted } from "../vol-slider/module.js";

export default async function ({ addon, console }) {
  const vm = addon.tab.traps.vm;
  setup(vm);

  const icon = document.createElement("img");
  icon.loading = "lazy";
  icon.src = addon.self.dir + "/mute.svg";
  icon.className = "sa-mute-project-icon";
  icon.style.userSelect = "none";
  addon.tab.displayNoneWhileDisabled(icon);

  const updateIcon = () => {
    icon.style.display = addon.self.disabled || !isMuted() ? "none" : "";
  };
  onVolumeChanged(updateIcon);
  updateIcon();

  const clickMuteButton = (e) => {
    if (!addon.self.disabled && (e.ctrlKey || e.metaKey)) {
      e.cancelBubble = true;
      e.preventDefault();
      setMuted(!isMuted());
    }
  };

  addon.self.addEventListener("disabled", () => {
    if (isMuted()) {
      setMuted(false);
    }
  });

  while (true) {
    let button = await addon.tab.waitForElement("[class^='green-flag_green-flag']", {
      markAsSeen: true,
      reduxEvents: ["scratch-gui/mode/SET_PLAYER", "fontsLoaded/SET_FONTS_LOADED", "scratch-gui/locales/SELECT_LOCALE"],
    });
    addon.tab.appendToSharedSpace({ space: "afterStopButton", element: icon, order: 0 });
    button.addEventListener("click", clickMuteButton);
    button.addEventListener("contextmenu", clickMuteButton);
  }
}
