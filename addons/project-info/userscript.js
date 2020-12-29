export default async function ({ addon, console, msg }) {
  const vm = addon.tab.traps.onceValues.vm;

  const getBlockCount = async () => {
    let scriptCount = 0;
    let sprites = new Set(vm.runtime.targets.map((i) => i.sprite.blocks._blocks));
    sprites.forEach((sprite, i) => {
      scriptCount += Object.values(sprite).filter((o) => !o.shadow).length;
    });
    return {
      scriptCount,
      spriteCount: sprites.size - 1,
    };
  };
  vm.runtime.on("PROJECT_LOADED", async () => {
    (async () => {
      if (addon.settings.get("editorCount")) {
        while (true) {
          const topBar = await addon.tab.waitForElement("[class^='menu-bar_main-menu']", { markAsSeen: true });
          let display = topBar.appendChild(document.createElement("span"));
          display.innerText = msg("blocks", { num: (await getBlockCount()).scriptCount });
          let debounce;
          vm.on("PROJECT_CHANGED", async () => {
            clearInterval(debounce);
            debounce = setTimeout(async () => {
              display.innerText = msg("blocks", { num: (await getBlockCount()).scriptCount });
            }, 1000);
          });
        }
      }
    })();

    while (true) {
      const buttons = await addon.tab.waitForElement(".preview .project-buttons", { markAsSeen: true });
      const container = document.createElement("div");
      container.className = "sa-project-info";
      buttons.insertBefore(container, buttons.firstChild);
      let projectInfo = await getBlockCount();
      container.appendChild(document.createTextNode(msg("sprite", { num: projectInfo.spriteCount })));
      container.appendChild(document.createElement("br"));
      container.appendChild(document.createTextNode(msg("script", { num: projectInfo.scriptCount })));
    }
  });
}
