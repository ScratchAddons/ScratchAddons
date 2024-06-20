export default async function ({ addon, msg, console }) {
  const vm = addon.tab.traps.vm;
  const ogCloneCounter = vm.runtime.changeCloneCounter;

  async function updateCounts() {
    let counts = {};
    let remove = addon.self.disabled || !addon.settings.get("showSpriteCount");

    vm.runtime.targets
      .filter((target) => !target.isOriginal)
      .map((target) => target.sprite.name)
      .forEach((target) => {
        if (!counts[target]) counts[target] = 1;
        else counts[target] += 1;
      });

    const spriteWrapper = await addon.tab.waitForElement("[class*=sprite-selector_items-wrapper]");
    const spriteNames = Array.from(spriteWrapper.querySelectorAll("[class*=sprite-selector-item_sprite-name]"));

    spriteNames.forEach((spriteName) => {
      if (counts[spriteName.innerText.split("\n")[0]] !== undefined) {
        const existingElement = spriteName.querySelector(".sa-clone-count");
        let count;

        if (remove) {
          existingElement?.remove();
          return;
        }

        if (existingElement) {
          count = existingElement;
        } else {
          count = document.createElement("div");
          count.classList.add("sa-clone-count");
          spriteName.appendChild(count);
        }

        count.innerText = msg("sprites", { spriteCount: counts[spriteName.innerText.split("\n")[0]] });
        console.log(msg("sprites", { spriteCount: counts[spriteName.innerText.split("\n")[0]] }));
      } else {
        const existingElement = spriteName.querySelector(".sa-clone-count");
        existingElement?.remove();
      }
    });
  }

  vm.runtime.changeCloneCounter = (e) => {
    console.log("changeCloneCounter");
    ogCloneCounter.call(vm.runtime, e);

    queueMicrotask(() => {
      updateCounts();
    });
  };

  vm.addListener("targetsUpdate", () => {
    console.log("targetsUpdate");
    queueMicrotask(() => {
      updateCounts();
    });
  });

  addon.self.addEventListener("disabled", updateCounts);
  addon.self.addEventListener("reenabled", updateCounts);
  addon.settings.addEventListener("change", updateCounts);
}
