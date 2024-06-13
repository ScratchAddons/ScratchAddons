export default async function ({ addon, console }) {
  const vm = addon.tab.traps.vm;
  const ogCloneCounter = vm.runtime.changeCloneCounter;

  function updateCounts(remove) {
    let counts = {};

    vm.runtime.targets
      .filter((target) => !target.isOriginal)
      .map((target) => target.sprite.name)
      .forEach((target) => {
        if (!counts[target]) counts[target] = 1;
        else counts[target] += 1;
      });

    const spriteNames = Array.from(
      document
        .querySelector("[class*=sprite-selector_items-wrapper]")
        .querySelectorAll("[class*=sprite-selector-item_sprite-name]")
    );

    spriteNames.forEach((spriteName) => {
      spriteName.querySelector(".clone-count")?.remove();
      if ((counts[spriteName.innerText.split("\n")[0]] !== undefined) & !remove) {
        const count = document.createElement("div");

        count.classList.add("clone-count");
        count.innerText = `(${counts[spriteName.innerText.split("\n")[0]]} clones)`;
        spriteName.appendChild(count);
      }
    });
  }

  function polute() {
    vm.runtime.changeCloneCounter = (e) => {
      ogCloneCounter.call(vm.runtime, e);

      if (addon.self.disabled) return;
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
      updateCounts(addon.self.disabled);
    }, 0);
  });

  addon.self.addEventListener("disabled", () => unpolute());
  addon.self.addEventListener("reenabled", () => polute());
}
