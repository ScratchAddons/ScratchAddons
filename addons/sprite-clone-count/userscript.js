export default async function ({ addon, console }) {
  const vm = addon.tab.traps.vm;
  const OGfunction = vm.runtime.changeCloneCounter;

  vm.runtime.changeCloneCounter = (e) => {
    OGfunction.call(vm.runtime, e);

    setTimeout(() => {
      let counts = {};

      vm.runtime.targets
        .filter((target) => !target.isOriginal)
        .map((target) => target.sprite.name)
        .forEach((target) => {
          if (!counts[target]) counts[target] = 1;
          else counts[target] += 1;
        });

      console.log(counts);

      const spriteNames = Array.from(
        document
          .querySelector("[class*=sprite-selector_items-wrapper]")
          .querySelectorAll("[class*=sprite-selector-item_sprite-name]")
      );

      console.log(spriteNames);

      spriteNames.forEach((spriteName) => {
        if (counts[spriteName.innerText.split("\n")[0]]) {
          spriteName.querySelector("div")?.remove();

          const count = document.createElement("div");

          count.innerText = `(${counts[spriteName.innerText.split("\n")[0]]} clones)`;
          spriteName.appendChild(count);
        }
      });
    }, 100);
  };
}
