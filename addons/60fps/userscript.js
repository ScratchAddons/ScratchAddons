export default async function ({ addon, global, console }) {
  console.log("60fps enabled");

  const vm = addon.tab.traps.onceValues.vm;

  while (true) {
    var button = await addon.tab.waitForElement("img.green-flag_green-flag_1kiAo:not([fpschecked])");
    button.setAttribute("fpschecked", "true");
    var mode = true;

    //console.log('just added class')

    button.addEventListener("click", (e) => {
      //console.log('click')
      if (e.altKey) {
        console.log("toggle 60fps");
        mode = !mode;
        vm.setCompatibilityMode(mode);

        if (mode) {
          button.style.filter = "";
        } else {
          //60fps
          button.style.filter = "hue-rotate(90deg)";
        }
      }
    });
  }
}
