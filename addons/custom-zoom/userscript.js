export default async function ({ addon, console }) {
  const Blockly = await addon.tab.traps.getBlockly();

  const speeds = {
    none: "0s",
    short: "0.2s",
    default: "0.3s",
    long: "0.5s",
  };

  const getElementAtPoint = (e) => {
    e.target.style.pointerEvents = "none";
    const elementAtPoint = document.elementFromPoint(e.x, e.y);
    e.target.style.pointerEvents = "auto";
    return elementAtPoint;
  };

  const customZoomAreaElement = document.createElement("div");
  customZoomAreaElement.className = "sa-custom-zoom-area";
  customZoomAreaElement.addEventListener("mousedown", (e) => {
    // old Blockly
    getElementAtPoint(e).dispatchEvent(new MouseEvent("mousedown", e));
  });
  customZoomAreaElement.addEventListener("pointerdown", (e) => {
    // new Blockly
    getElementAtPoint(e).dispatchEvent(new PointerEvent("pointerdown", e));
  });
  customZoomAreaElement.addEventListener("wheel", (e) => {
    e.preventDefault();
    getElementAtPoint(e).dispatchEvent(new WheelEvent("wheel", e));
  });

  function update() {
    if (addon.tab.editorMode !== "editor") return;

    const workspace = addon.tab.traps.getWorkspace();
    const zoomOptions = workspace.options.zoom || workspace.options.zoomOptions; // new Blockly || old Blockly
    zoomOptions.maxScale = addon.settings.get("maxZoom") / 100;
    zoomOptions.minScale = addon.settings.get("minZoom") / 100;
    zoomOptions.startScale = addon.settings.get("startZoom") / 100;
    zoomOptions.scaleSpeed = 1 + 0.2 * (addon.settings.get("zoomSpeed") / 100);

    const autohide = addon.settings.get("autohide");
    const blocklySvg = document.querySelector(".blocklySvg");
    blocklySvg.classList.toggle("sa-custom-zoom-autohide", autohide);
    if (autohide) {
      blocklySvg.style.setProperty("--sa-custom-zoom-speed", speeds[addon.settings.get("speed")]);
      blocklySvg.insertAdjacentElement("beforebegin", customZoomAreaElement);
    }
  }

  if (document.querySelector('[class^="backpack_backpack-container"]')) {
    window.dispatchEvent(new Event("resize"));
  }
  addon.settings.addEventListener("change", update);
  while (true) {
    const selector = Blockly.registry ? ".blocklyZoomReset" : ".blocklyZoom";
    await addon.tab.waitForElement(selector, {
      markAsSeen: true,
      reduxEvents: [
        "scratch-gui/mode/SET_PLAYER",
        "scratch-gui/locales/SELECT_LOCALE",
        "scratch-gui/theme/SET_THEME",
        "fontsLoaded/SET_FONTS_LOADED",
      ],
      reduxCondition: (state) => !state.scratchGui.mode.isPlayerOnly,
    });
    update();
  }
}
