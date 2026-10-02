export default async function ({ addon, msg, console }) {
  const vm = addon.tab.traps.vm;
  const ogCloneCounter = vm.runtime.changeCloneCounter;
  let spriteNamesCache;

  async function updateCounts(force) {
    const counts = {};
    const remove = addon.self.disabled || !addon.settings.get("showSpriteCount");

    vm.runtime.targets
      .filter((target) => !target.isOriginal)
      .forEach((target) => {
        const name = target.sprite.name;
        counts[name] = (counts[name] || 0) + 1;
      });

    let spriteNames;
    if (!spriteNamesCache || force) {
      spriteNames = Array.from(
        document.querySelectorAll("[class*=sprite-selector_items-wrapper] [class*=sprite-selector-item_sprite-name]")
      );
      spriteNamesCache = Array.from(spriteNames);
    } else {
      spriteNames = spriteNamesCache;
    }

    spriteNames.forEach((spriteName) => {
      const name = spriteName.innerText.split("\n")[0];
      const count = counts[name];
      const existingElement = spriteName.querySelector(".sa-clone-count");

      if (count !== undefined) {
        if (remove) {
          if (existingElement) {
            existingElement.style.display = "none";
          }
        } else {
          const countElement = existingElement || document.createElement("div");
          if (!existingElement) {
            countElement.classList.add("sa-clone-count");
            spriteName.appendChild(countElement);
          }
          countElement.innerText = msg("sprites", { spriteCount: count });
          countElement.style.display = "";
        }
      } else if (existingElement) {
        existingElement.style.display = "none";
      }
    });
  }

  vm.runtime.changeCloneCounter = (e) => {
    ogCloneCounter.call(vm.runtime, e);
    queueMicrotask(updateCounts);
  };

  vm.addListener("targetsUpdate", () =>
    queueMicrotask(() => {
      updateCounts.call(this, true);
    })
  );
  addon.self.addEventListener("disabled", updateCounts);
  addon.self.addEventListener("reenabled", updateCounts);
  addon.settings.addEventListener("change", updateCounts);
}
