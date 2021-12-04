export default async function ({ addon, console, msg }) {
  const vm = addon.tab.traps.vm;

  const getBlockCount = () => {
    let blockCount = 0;
    let scriptCount = 0;
    let sprites = new Set(vm.runtime.targets.map((i) => i.sprite.blocks._blocks));
    sprites.forEach((sprite, i) => {
      scriptCount += Object.values(sprite).filter((o) => !o.parent).length; // Filter blocks that don't have a parent (meaning it's the top of a stack)
      blockCount += Object.values(sprite).filter((o) => !o.shadow).length; // shadow blocks should be filtered out
    });
    return {
      blockCount,
      scriptCount,
      spriteCount: sprites.size - 1, // Backdrop counts as a target so we can subtract it
    };
  };

  const addLiveBlockCount = async () => {
    if (vm.editingTarget) {
      let handler = null;
      while (true) {
        const topBar = await addon.tab.waitForElement("[class^='menu-bar_main-menu']", {
          markAsSeen: true,
          reduxEvents: [
            "scratch-gui/mode/SET_PLAYER",
            "fontsLoaded/SET_FONTS_LOADED",
            "scratch-gui/locales/SELECT_LOCALE",
          ],
          reduxCondition: (state) => !state.scratchGui.mode.isPlayerOnly,
        });
        let display = topBar.appendChild(document.createElement("span"));
        display.style.order = 1;
        display.style.padding = "9px";
        display.innerText = msg("blocks", { num: getBlockCount().blockCount });
        let debounce; // debouncing values because of the way 'PROJECT_CHANGED' works
        if (handler) {
          vm.off("PROJECT_CHANGED", handler);
          vm.runtime.off("PROJECT_LOADED", handler);
        }
        handler = async () => {
          clearTimeout(debounce);
          debounce = setTimeout(async () => {
            display.innerText = msg("blocks", { num: getBlockCount().blockCount });
          }, 1000);
        };
        vm.on("PROJECT_CHANGED", handler);
        vm.runtime.on("PROJECT_LOADED", handler);
      }
    } else {
      let timeout = setTimeout(function () {
        addLiveBlockCount();
        clearTimeout(timeout);
      }, 1000);
    }
  };

  addLiveBlockCount();
}
