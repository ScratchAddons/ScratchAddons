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

  const addProjectPageStats = async () => {
    while (true) {
      await addon.tab.waitForElement(".preview .project-buttons", {
        markAsSeen: true,
        reduxEvents: [
          "scratch-gui/mode/SET_PLAYER",
          "fontsLoaded/SET_FONTS_LOADED",
          "scratch-gui/locales/SELECT_LOCALE",
        ],
        reduxCondition: (state) => state.scratchGui.mode.isPlayerOnly,
      });
      const container = document.createElement("div");
      container.className = "sa-project-info";
      addon.tab.displayNoneWhileDisabled(container);
      addon.tab.appendToSharedSpace({ space: "beforeRemixButton", element: container, order: 0 });
      let spriteImg = document.createElement("img");
      spriteImg.setAttribute("src", "https://scratch.mit.edu/svgs/project/sprite-count.svg");
      container.appendChild(spriteImg);
      let spriteLbl = document.createElement("span");
      spriteLbl.id = "spriteLabel";
      container.appendChild(spriteLbl);
      container.appendChild(document.createElement("br"));
      let scriptImg = document.createElement("img");
      scriptImg.setAttribute("src", "https://scratch.mit.edu/svgs/project/block-count.svg");
      container.appendChild(scriptImg);
      let scriptLbl = document.createElement("span");
      scriptLbl.id = "scriptLabel";
      container.appendChild(scriptLbl);
      updateLabels();
    }
  };

  function updateLabels() {
    let setting = addon.settings.get("show");
    let projectInfo = getBlockCount();
    document.querySelector("#spriteLabel").innerText =
      setting === "icon" ? projectInfo.spriteCount : msg("sprite", { num: projectInfo.spriteCount });
    document.querySelector("#scriptLabel").innerText =
      setting === "icon" ? projectInfo.scriptCount : msg("script", { num: projectInfo.scriptCount });
  }

  // addProjectPageStats either when the project is loaded through the project page or when the user goes from the editor to the project page
  vm.runtime.on("PROJECT_LOADED", async () => addProjectPageStats());
  addon.tab.addEventListener("urlChange", (e) => addProjectPageStats());
  // The addon ran late, so PROJECT_LOADED already happened.
  if (addon.self.enabledLate) addProjectPageStats();
  addon.settings.addEventListener("change", (e) => updateLabels());
}
