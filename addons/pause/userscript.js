import { isPaused, setPaused, onPauseChanged, setup } from "../debugger/module.js";
import { autoPauseAvailable, startCheckingCloudTraffic } from "./check-online.js";

export default async function ({ addon, console, msg }) {
  setup(addon);
  startCheckingCloudTraffic(addon.tab);

  let autoResume = false;
  const img = document.createElement("img");

  const setSrc = () => {
    img.src = addon.self.dir + (isPaused() ? "/play.svg" : "/pause.svg");
    img.title = isPaused() ? msg("play") : msg("pause");
  };
  const updateVisibility = () => {
    img.toggleAttribute("hidden", addon.self.disabled || !addon.settings.get("pause-button"));
  };

  img.className = "pause-btn";
  img.draggable = false;
  img.title = msg("pause");
  img.addEventListener("click", () => setPaused(!isPaused()));
  addon.self.addEventListener("disabled", () => setPaused(false));
  updateVisibility();
  setSrc();
  onPauseChanged(setSrc);

  document.addEventListener(
    "keydown",
    function (e) {
      // e.code is not enough because that corresponds to physical keys, ignoring keyboard layouts.
      // e.key is not enough because on macOS, option+x types ≈ and shift+option+x types ˛
      // e.keyCode is always 88 when pressing x regardless of modifier keys, so that's how we'll handle macOS.
      // Because keyCode is deprecated we'll still check e.key in case keyCode is not as reliable as we think it is
      if (e.altKey && (e.key.toLowerCase() === "x" || e.keyCode === 88) && !addon.self.disabled) {
        e.preventDefault();
        e.stopImmediatePropagation();
        setPaused(!isPaused());
      }
    },
    { capture: true }
  );

  const doAutoPause = () => {
    if (!addon.self.disabled && addon.settings.get("auto-pause") && autoPauseAvailable()) {
      if (!isPaused()) {
        autoResume = true;
        setPaused(true);
      }
    } else {
      console.warn("Auto-pause unavailable");
    }
  };
  const doAutoUnpause = () => {
    if (autoResume) {
      setPaused(false);
      autoResume = false;
    }
  };

  window.addEventListener("focus", doAutoUnpause);
  window.addEventListener("blur", doAutoPause);

  addon.self.addEventListener("disabled", updateVisibility);
  addon.self.addEventListener("reenabled", updateVisibility);
  addon.settings.addEventListener("change", updateVisibility);

  while (true) {
    await addon.tab.waitForElement("[class^='green-flag']", {
      markAsSeen: true,
      reduxEvents: ["scratch-gui/mode/SET_PLAYER", "fontsLoaded/SET_FONTS_LOADED", "scratch-gui/locales/SELECT_LOCALE"],
    });
    addon.tab.appendToSharedSpace({ space: "afterGreenFlag", element: img, order: 0 });
    const commentTextarea = document.querySelector(".comments-container textarea");
    if (commentTextarea) {
      commentTextarea.addEventListener("blur", doAutoUnpause);
      commentTextarea.addEventListener("focus", doAutoPause);
    }
  }
}
