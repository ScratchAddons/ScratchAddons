export default async function ({ addon, console }) {
  function getMode() {
    if (addon.self.disabled) return null;
    return addon.settings.get("mode");
  }

  let mode = getMode();
  let logo;
  let initialSrc;
  let projectorSound;

  function updateLogo() {
    if (!logo) return;
    logo.src = {
      "90s": addon.self.dir + "/assets/nineties_logo.svg",
      "oldTimey": addon.self.dir + "/assets/oldtimey-logo.svg",
      "prehistoric": addon.self.dir + "/assets/prehistoric-logo.svg",
    }[mode] || initialSrc;
  }
  function updateProjectorSound() {
    if (["editor", "fullscreen"].includes(addon.tab.editorMode) && mode === "oldTimey") {
      if (!projectorSound) {
        projectorSound = new Audio(addon.self.dir + "/assets/projector2.mp3");
        projectorSound.volume = 0.1;
        projectorSound.loop = true;
      }
      projectorSound.play();
    } else if (projectorSound) projectorSound.pause();
  }
  updateProjectorSound();

  // start playing when user interacts with the page
  const interactionListener = () => {
    document.removeEventListener("click", interactionListener);
    document.removeEventListener("keydown", interactionListener);
    updateProjectorSound();
  };
  document.addEventListener("click", interactionListener);
  document.addEventListener("keydown", interactionListener);

  document.documentElement.style.setProperty("--sa-mouse-x", `${window.innerWidth / 2}px`);
  document.documentElement.style.setProperty("--sa-mouse-y", `${window.innerHeight / 2}px`);
  document.addEventListener("pointermove", (e) => {
    document.documentElement.style.setProperty("--sa-mouse-x", `${e.clientX}px`);
    document.documentElement.style.setProperty("--sa-mouse-y", `${e.clientY}px`);
  });

  const onSettingChange = () => {
    mode = getMode();
    updateLogo();
    updateProjectorSound();
  };
  addon.self.addEventListener("disabled", onSettingChange);
  addon.self.addEventListener("reenabled", onSettingChange);
  addon.settings.addEventListener("change", onSettingChange);
  addon.tab.addEventListener("urlChange", () => {
    updateProjectorSound();
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
