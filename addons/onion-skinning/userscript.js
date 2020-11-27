export default async function ({ addon, global, console }) {
  let project;
  let onionLayer;
  let paperCanvas;

  const foundPaper = (_project) => {
    if (project === _project) {
      return;
    }
    project = _project;
    console.log("project", _project);

    const originalExportSVG = project.exportSVG;
    project.exportSVG = function (...args) {
      onionLayer.remove();
      const ret = originalExportSVG.call(this, ...args);
      this.addLayer(onionLayer);
      return ret;
    };

    const paintLayer = project.activeLayer;
    onionLayer = new project.activeLayer.constructor();
    console.log("onionLayer", onionLayer);
    onionLayer.opacity = 0.2;
    onionLayer.locked = true;
    paintLayer.activate();
  };

  const foundPaperCanvas = (_paperCanvas) => {
    if (paperCanvas === _paperCanvas) {
      return;
    }
    paperCanvas = _paperCanvas;
    console.log("paperCanvas", paperCanvas);
  };

  const updateOnionLayer = () => {
    const costumeList = Array.from(document.querySelector("[class^='selector_list-area']").children);
    let selectedCostume = -1;
    for (let i = 0; i < costumeList.length; i++) {
      const item = costumeList[i].firstChild;
      if (item && item.className.includes("is-selected")) {
        selectedCostume = i;
        break;
      }
    }

    if (selectedCostume === -1) {
      // Should never happen.
      throw new Error("Couldn't find selected costume");
    }

    if (selectedCostume === 0) {
      // Can't show an onion skin if there is no previous skin.
      return;
    }

    const onionIndex = selectedCostume - 1;

    const vm = addon.tab.traps.onceValues.vm;
    const costume = vm.editingTarget.sprite.costumes[onionIndex];
    const asset = vm.getCostume(onionIndex);

    if (typeof paperCanvas.importImage !== "function" || typeof paperCanvas.recalibrateSize !== "function") {
      throw new Error("Assumptions invalid.");
    }

    const activeLayer = project.activeLayer;

    const originalRecalibrate = paperCanvas.recalibrateSize;
    paperCanvas.recalibrateSize = function (callback) {
      originalRecalibrate.call(this, function () {
        if (callback) callback();
        activeLayer.activate();
        paperCanvas.recalibrateSize = originalRecalibrate;
      });
    }

    onionLayer.bringToFront();
    onionLayer.removeChildren();
    onionLayer.activate();

    paperCanvas.importImage(costume.dataFormat, asset, costume.rotationCenterX, costume.rotationCenterY);
  };

  window.e = updateOnionLayer;

  // https://github.com/LLK/paper.js/blob/16d5ff0267e3a0ef647c25e58182a27300afad20/src/item/Project.js#L64-L65
  Object.defineProperty(Object.prototype, "_view", {
    set(value) {
      // TODO: this can and will break things
      Object.defineProperty(this, "_view", {
        value: value,
        writable: true
      });
      foundPaper(this);
    }
  });

  // https://github.com/LLK/scratch-paint/blob/cdf0afc217633e6cfb8ba90ea4ae38b79882cf6c/src/containers/paper-canvas.jsx#L45-L51
  Object.defineProperty(Object.prototype, "shouldZoomToFit", {
    set(value) {
      // TODO: this can and will break things
      Object.defineProperty(this, "shouldZoomToFit", {
        value: value,
        writable: true
      });
      foundPaperCanvas(this);
    }
  });
}
