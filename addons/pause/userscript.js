import { isPaused, setPaused, onPauseChanged, setup } from "../debugger/module.js";

export default async function ({ addon, console, msg }) {
  setup(addon.tab.traps.vm);

  const img = document.createElement("img");
  img.className = "pause-btn";
  img.draggable = false;
  img.title = msg("pause");

  const setSrc = () => (img.src = addon.self.dir + (isPaused() ? "/play.svg" : "/pause.svg"));
  img.addEventListener("click", () => setPaused(!isPaused())); // Toggle when clicking the button
  addon.tab.displayNoneWhileDisabled(img);
  addon.self.addEventListener("disabled", () => {
    setPaused(false);
    try {
      window.removeEventListener("blur", autoPause);
    } catch {
      /*Avoids throwing an error message if the event listener is not found*/
    }
  });
  addon.self.addEventListener("reenabled", () => {
    if (addon.settings.get("auto-pause")) window.addEventListener("blur", autoPause);
  });
  setSrc();
  onPauseChanged(setSrc);

  document.addEventListener("keydown", function (e) {
    if (e.altKey && e.code === "KeyX" && !addon.self.disabled) {
      e.preventDefault();
      setPaused(!isPaused());
    }
  });

  function autoPause() {
    setPaused(true);
  }

  if (addon.settings.get("auto-pause")) window.addEventListener("blur", autoPause);
  addon.settings.addEventListener("change", () => {
    if (addon.settings.get("auto-pause")) window.addEventListener("blur", autoPause);
    else window.removeEventListener("blur", autoPause);
  });

  while (true) {
    await addon.tab.waitForElement("[class^='green-flag']", {
      markAsSeen: true,
      reduxEvents: ["scratch-gui/mode/SET_PLAYER", "fontsLoaded/SET_FONTS_LOADED", "scratch-gui/locales/SELECT_LOCALE"],
    });
    addon.tab.appendToSharedSpace({ space: "afterGreenFlag", element: img, order: 0 });
  }
}
