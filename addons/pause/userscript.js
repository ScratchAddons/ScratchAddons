import { isPaused, setPaused, onPauseChanged, setup } from "../debugger/module.js";

export default async function ({ addon, console, msg }) {
  setup(addon.tab.traps.vm);

  const img = document.createElement("img");
  img.className = "pause-btn";
  img.draggable = false;
  img.title = msg("pause");

  const setSrc = () => {
    img.src = addon.self.dir + (isPaused() ? "/play.svg" : "/pause.svg");
    img.title = isPaused() ? msg("play") : msg("pause");
  };
  img.addEventListener("click", () => setPaused(!isPaused()));
  addon.tab.displayNoneWhileDisabled(img);
  addon.self.addEventListener("disabled", () => setPaused(false));
  setSrc();
  onPauseChanged(setSrc);

  document.addEventListener("keydown", function (e) {
    // e.code is not enough because that corresponds to physical keys, ignoring keyboard layouts.
    // e.key is not enough because on macOS, option+x types ≈ and shift+option+x types ˛
    // e.keyCode is always 88 when pressing x regardless of modifier keys, so that's how we'll handle macOS.
    // Because keyCode is deprecated we'll still check e.key in case keyCode is not as reliable as we think it is
    if (e.altKey && (e.key.toLowerCase() === "x" || e.keyCode === 88) && !addon.self.disabled) {
      e.preventDefault();
      setPaused(!isPaused());
    }
  });

  while (true) {
    await addon.tab.waitForElement("[class^='green-flag']", {
      markAsSeen: true,
      reduxEvents: ["scratch-gui/mode/SET_PLAYER", "fontsLoaded/SET_FONTS_LOADED", "scratch-gui/locales/SELECT_LOCALE"],
    });
    addon.tab.appendToSharedSpace({ space: "afterGreenFlag", element: img, order: 0 });
  }
}
