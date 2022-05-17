export default async function ({ addon, console }) {
  let mode = addon.settings.get("mode");
  let logo;
  let initialSrc;
  function updateLogo() {
    if (!logo) return;
    logo.src = {
      "90s": addon.self.dir + "/assets/nineties_logo.svg",
    }[mode] || initialSrc;
  }
  addon.settings.addEventListener("change", () => {
    mode = addon.settings.get("mode");
    updateLogo();
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
