export default async function ({ addon, console }) {
  await addon.tab.traps.getBlockly();

  let controlsRect;
  let previousIsHovered = false;
  const speeds = {
    none: "0s",
    short: "0.2s",
    default: "0.3s",
    long: "0.5s",
  };

  const customZoomAreaElement = document.createElement("div");
  customZoomAreaElement.className = "sa-custom-zoom-area";

  function update() {
    document.removeEventListener("mousemove", onMouseMove);

    if (addon.tab.editorMode !== "editor") return;

    Blockly.getMainWorkspace().options.zoomOptions.maxScale = addon.settings.get("maxZoom") / 100;
    Blockly.getMainWorkspace().options.zoomOptions.minScale = addon.settings.get("minZoom") / 100;
    Blockly.getMainWorkspace().options.zoomOptions.startScale = addon.settings.get("startZoom") / 100;
    Blockly.getMainWorkspace().options.zoomOptions.scaleSpeed = 1 + 0.2 * (addon.settings.get("zoomSpeed") / 100);

    const svgGroup = getZoomControls();
    const autohide = addon.settings.get("autohide");
    if (svgGroup) svgGroup.classList.toggle("sa-custom-zoom-hidden", autohide);
    if (autohide) {
      const injectionDiv = document.querySelector(".injectionDiv");
      injectionDiv.appendChild(customZoomAreaElement);
      updateRect();
      document.addEventListener("mousemove", onMouseMove);
    }
  }

  function getZoomControls() {
    const zoomControls = Blockly.getMainWorkspace().zoomControls_;
    if (zoomControls) return zoomControls.svgGroup_;
    return null;
  }

  function onMouseMove(e) {
    const isHovered =
      e.x > controlsRect.left && e.x < controlsRect.right && e.y > controlsRect.top && e.y < controlsRect.bottom;
    if (isHovered !== previousIsHovered) {
      previousIsHovered = isHovered;
      const svgGroup = getZoomControls();
      if (svgGroup) {
        svgGroup.style.setProperty("--sa-custom-zoom-speed", speeds[addon.settings.get("speed")]);
        svgGroup.classList.toggle("sa-custom-zoom-hidden", !isHovered);
      }
    }
  }

  function updateRect() {
    controlsRect = customZoomAreaElement.getBoundingClientRect();
  }

  function onResize() {
    if (addon.tab.editorMode === "editor" && addon.settings.get("autohide")) {
      updateRect();
    }
  }

  if (document.querySelector('[class^="backpack_backpack-container"]')) {
    window.dispatchEvent(new Event("resize"));
  }
  addon.settings.addEventListener("change", update);
  window.addEventListener("resize", onResize);
  while (true) {
    await addon.tab.waitForElement(".blocklyZoom", {
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
