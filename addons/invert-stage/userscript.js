export default async function ({ addon, console, msg }) {
  // INVERT STAGE ADDON BY @BATMANGREEN123 (MICHEALTHERATZ)
  const vm = addon.tab.traps.vm;
  const canvas = vm.renderer.canvas;

  // I spent an HOUR fixing a bug until I found out I was MISSING this variable!!!!
  // THANKS [REDACTED]!
  let invert = false;

  // CREATING THE BUTTON (Using material icons bc i'm lazy)
  const img = document.createElement("img");
  img.className = "invert-btn btn-container";
  img.draggable = false;
  img.src = addon.self.dir + "/contrast.svg";

  // EVENT LISTENERS
  img.addEventListener("click", () => invert = !invert);
  addon.tab.displayNoneWhileDisabled(img);
  addon.self.addEventListener("disabled", () => invert = false);

  // HAD TO PUT THIS TO MAKE THE STAGE INVERTED EVERY FRAME
  let loop = () => {
    canvas.style.filter = `invert(${invert ? "100" : "0"}%)`;

    window.requestAnimationFrame(loop);
  }
  window.requestAnimationFrame(loop);

  while (true) {
    // ADDING THE BUTTON INTO THE SCRATCH-GUI
    await addon.tab.waitForElement("[class^='stage-header_stage-menu-wrapper']", {
      markAsSeen: true,
      reduxEvents: ["scratch-gui/mode/SET_PLAYER", "fontsLoaded/SET_FONTS_LOADED", "scratch-gui/locales/SELECT_LOCALE"],
    });
    addon.tab.appendToSharedSpace({ space: "fullscreenStageHeader", element: img, order: 2 });
  }
}