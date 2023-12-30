export default async function ({ addon, console, msg }) {
  const VM = addon.tab.traps.vm;
  const canvas = VM.renderer.canvas;

  // CREATING BUTTON
  const img = document.createElement("img");
  img.className = "pause-btn";
  img.draggable = false;
  img.src = addon.self.dir + "/contrast.svg";
  img.title = msg("invert");

  // INVERTING THE STAGE
  img.addEventListener("click", () => invert = !invert);
  addon.tab.displayNoneWhileDisabled(img);
  addon.self.addEventListener("disabled", () => invert = false);

  // KEEPING STAGE INVERTED
  let loop = () => {
    canvas.style.filter = `invert(${invert ? "100" : "0"}%)`
    window.requestAnimationFrame(loop)
  }
  window.requestAnimationFrame(loop)

  while (true) {
    // ADDING BUTTON TO GUI
    await addon.tab.waitForElement("[class^='green-flag']", {
      markAsSeen: true,
      reduxEvents: ["scratch-gui/mode/SET_PLAYER", "fontsLoaded/SET_FONTS_LOADED", "scratch-gui/locales/SELECT_LOCALE"],
    });
    addon.tab.appendToSharedSpace({ space: "afterGreenFlag", element: img, order: 2 });
    
  }
}