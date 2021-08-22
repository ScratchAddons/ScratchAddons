export default async ({ addon, msg }) => {
  const { vm } = addon.tab.traps;

  const img = document.createElement("img");
  img.className = addon.tab.scratchClass("green-flag_green-flag") + " sa-turbo-mode-btn";
  img.draggable = false;
  img.title = msg("title");
  img.src = addon.self.dir + "/turbo.svg";

  img.addEventListener("click", (e) => {
    e.preventDefault();
    vm.setTurboMode(!vm.runtime.turboMode);
  });

  addon.tab.displayNoneWhileDisabled(img);

  vm.on("TURBO_MODE_ON", () => {
    img.classList.add(addon.tab.scratchClass("green-flag_is-active"));
  });

  vm.on("TURBO_MODE_OFF", () => {
    img.classList.remove(addon.tab.scratchClass("green-flag_is-active"));
  });

  while (1) {
    await addon.tab.waitForElement("[class^='green-flag']:not(.sa-turbo-mode-btn)", {
      markAsSeen: true,
      reduxEvents: ["scratch-gui/mode/SET_PLAYER", "fontsLoaded/SET_FONTS_LOADED", "scratch-gui/locales/SELECT_LOCALE"],
    });
    addon.tab.appendToSharedSpace({ space: "afterGreenFlag", element: img, order: 1 });
  }
};
