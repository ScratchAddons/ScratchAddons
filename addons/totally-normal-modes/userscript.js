export default async function ({ addon, console }) {
  let mode = addon.settings.get("mode");
  let logo;
  let initialSrc;
  let projectorSound;

  function updateLogo() {
    if (!logo) return;
    logo.src = {
      "90s": addon.self.dir + "/assets/nineties_logo.svg",
      "oldTimey": addon.self.dir + "/assets/oldtimey-logo.svg",
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

  addon.settings.addEventListener("change", () => {
    mode = addon.settings.get("mode");
    updateLogo();
    updateProjectorSound();
  });
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
