export default async function ({ addon, global, console }) {
  console.log("60fps enabled");

  const vm = addon.tab.traps.onceValues.vm;

  let altPressesCount = 0;
  let altPressedRecently = false;
  window.addEventListener("keydown", (event) => {
    if (event.key === "Alt") {
      altPressesCount++;
      const pressCount = altPressesCount;
      altPressedRecently = true;
      setTimeout(() => {
        if (pressCount === altPressesCount) altPressedRecently = false;
      }, 2500);
    }
  });

  while (true) {
    let button = await addon.tab.waitForElement("[class^='green-flag_green-flag']", { markAsSeen: true });
    let mode = true;

    button.addEventListener("click", (e) => {
      if (e.altKey) {
        mode = !mode;
        vm.setCompatibilityMode(mode);
        button.style.filter = mode ? "" : "hue-rotate(90deg)";
      }
    });
    button.addEventListener("contextmenu", (e) => {
      if (altPressedRecently) {
        e.preventDefault();
        mode = !mode;
        vm.setCompatibilityMode(mode);
        button.style.filter = mode ? "" : "hue-rotate(90deg)";
      }
    });
  }
}
