export default async function ({ addon, console }) {
  const vm = addon.tab.traps.vm;
  const ogCloneCounter = vm.runtime.changeCloneCounter;

  async function updateCounts(remove) {
    let counts = {};

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

        count.innerText = `(${counts[spriteName.innerText.split("\n")[0]]} clones)`;
      }
    });
  }

  function polute() {
    if (!addon.settings.get("showSpriteCount")) return;

    vm.runtime.changeCloneCounter = (e) => {
      ogCloneCounter.call(vm.runtime, e);

      setTimeout(() => {
        updateCounts();
      }, 100);
    };

    updateCounts(false);
  }

  function unpolute() {
    vm.runtime.changeCloneCounter = ogCloneCounter;
    updateCounts(true);
  }

  polute();

  vm.addListener("targetsUpdate", () => {
    setTimeout(() => {
      updateCounts(addon.self.disabled || !addon.settings.get("showSpriteCount"));
    }, 0);
  });

  addon.self.addEventListener("disabled", () => unpolute());
  addon.self.addEventListener("reenabled", () => polute());

  addon.settings.addEventListener("change", () => {
    if (addon.settings.get("showSpriteCount")) polute();
    else unpolute();
  });
}
