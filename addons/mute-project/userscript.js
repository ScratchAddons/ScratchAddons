import { setup, isMuted, setVol, getDefVol } from "../vol-slider/module.js";

export default async function ({ addon, console }) {
  const vm = addon.tab.traps.vm;
  let icon = document.createElement("img");
  icon.src = "/static/assets/e21225ab4b675bc61eed30cfb510c288.svg";
  icon.loading = "lazy";
  icon.style.display = "none";
  icon.className = "sa-mute-icon";
  const toggleMute = (e) => {
    if (!addon.self.disabled && (e.ctrlKey || e.metaKey)) {
      e.cancelBubble = true;
      e.preventDefault();
      if (isMuted()) {
        setVol(getDefVol());
        icon.style.display = "none";
      } else {
        setVol(0);
        icon.style.display = "block";
      }
    }
  };
  addon.self.addEventListener("disabled", () => {
    setVol(1);
    icon.style.display = "none";
  });

  while (true) {
    let button = await addon.tab.waitForElement("[class^='green-flag_green-flag']", {
      markAsSeen: true,
      reduxEvents: ["scratch-gui/mode/SET_PLAYER", "fontsLoaded/SET_FONTS_LOADED", "scratch-gui/locales/SELECT_LOCALE"],
    });
    addon.tab.appendToSharedSpace({ space: "afterStopButton", element: icon, order: 0 });
    setup(vm);
    button.addEventListener("click", toggleMute);
    button.addEventListener("contextmenu", toggleMute);
  }
}
