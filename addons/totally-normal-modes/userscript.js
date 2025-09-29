import * as oldTimey from "./oldtimey.js";
import * as mystery from "./mystery.js";

export default async function ({ addon, console }) {
  function getMode() {
    if (addon.self.disabled) return null;
    return addon.settings.get("mode");
  }

  let mode = getMode();
  let logo;
  let initialSrc;

  function updateLogo() {
    if (!logo) return;
    logo.src =
      {
        "90s": addon.self.dir + "/assets/nineties_logo.svg",
        oldTimey: addon.self.dir + "/assets/oldtimey-logo.svg",
        prehistoric: addon.self.dir + "/assets/prehistoric-logo.svg",
      }[mode] || initialSrc;
  }

  document.body.appendChild(
    Object.assign(document.createElement("div"), {
      className: "sa-mode",
    })
  );

  oldTimey.updateSound(addon, mode);
  mystery.update(addon, mode);

  // start playing sound when user interacts with the page
  const interactionListener = () => {
    document.removeEventListener("click", interactionListener);
    document.removeEventListener("keydown", interactionListener);
    oldTimey.updateSound(addon, mode);
  };
  document.addEventListener("click", interactionListener);
  document.addEventListener("keydown", interactionListener);

  document.documentElement.style.setProperty("--sa-mouse-x", `${window.innerWidth / 2}px`);
  document.documentElement.style.setProperty("--sa-mouse-y", `${window.innerHeight / 2}px`);
  const pointerMoveListener = (e) => {
    document.documentElement.style.setProperty("--sa-mouse-x", `${e.clientX}px`);
    document.documentElement.style.setProperty("--sa-mouse-y", `${e.clientY}px`);
    mystery.setMousePosition(e.clientX, e.clientY);
  };
  function updatePointerMoveListener() {
    if (addon.tab.editorMode === "editor" && ["prehistoric", "mystery"].includes(mode)) {
      document.addEventListener("pointermove", pointerMoveListener);
    } else {
      document.removeEventListener("pointermove", pointerMoveListener);
    }
  }
  updatePointerMoveListener();

  const onSettingChange = () => {
    mode = getMode();
    updateLogo();
    oldTimey.updateSound(addon, mode);
    mystery.update(addon, mode);
    updatePointerMoveListener();
  };
  addon.self.addEventListener("disabled", onSettingChange);
  addon.self.addEventListener("reenabled", onSettingChange);
  addon.settings.addEventListener("change", onSettingChange);

  addon.tab.redux.initialize();
  addon.tab.redux.addEventListener("statechanged", (e) => {
    if (
      e.detail.action.type === "scratch-gui/mode/SET_FULL_SCREEN" ||
      e.detail.action.type === "scratch-gui/mode/SET_PLAYER"
    ) {
      setTimeout(() => {
        oldTimey.updateSound(addon, mode);
        mystery.update(addon, mode);
        updatePointerMoveListener();
      }, 0); // wait for addon.tab.editorMode to update
    }
  });

  while (true) {
    logo = await addon.tab.waitForElement("[class*='menu-bar_scratch-logo_']", {
      markAsSeen: true,
      reduxEvents: ["scratch-gui/mode/SET_PLAYER", "fontsLoaded/SET_FONTS_LOADED", "scratch-gui/locales/SELECT_LOCALE"],
      reduxCondition: (state) => !state.scratchGui.mode.isPlayerOnly,
    });
    initialSrc = logo.src;
    updateLogo();
  }
}
