export default async function ({ addon, console, msg }) {
  const vm = addon.tab.traps.onceValues.vm;
  
  const getBlockCount = async () => {
    let blockCount = 0;
    let scriptCount = 0;
    let sprites = new Set(vm.runtime.targets.map(i => i.sprite.blocks._blocks));
    sprites.forEach((sprite, i) => {
      scriptCount += Object.values(sprite).filter(o => !o.parent).length;
      blockCount += Object.values(sprite).filter(o => !o.shadow).length;
    });
    return {
      blockCount,
      scriptCount,
      spriteCount: sprites.size - 1
    };
  }

  const addProjectPageStats = async () => {
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
  }

  vm.runtime.on("PROJECT_LOADED", async () => addProjectPageStats());
  addon.tab.addEventListener("urlChange", e => addProjectPageStats());

  if (addon.settings.get("editorCount") && vm.editingTarget) {
    while (true) {
      const topBar = await addon.tab.waitForElement("[class^='menu-bar_main-menu']", { markAsSeen: true });
      let display = topBar.appendChild(document.createElement("span"));
      display.innerText = msg("blocks", { num: (await getBlockCount()).blockCount });
      let debounce;
      vm.on('PROJECT_CHANGED', async () => {
        clearInterval(debounce)
        debounce = setTimeout(async () => {
          display.innerText = msg("blocks", { num: (await getBlockCount()).blockCount });
        }, 1000);
      });
    }
  }

}
