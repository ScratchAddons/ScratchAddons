export default async function ({ addon, global, console }) {
  let project;
  let onionLayer;
  let paperCanvas;

  const foundPaper = (_project) => {
    project = _project;
    console.log("project", _project);

    const originalExportSVG = project.exportSVG;
    project.exportSVG = function (...args) {
      onionLayer.remove();
      const ret = originalExportSVG.call(this, ...args);
      this.addLayer(onionLayer);
      return ret;
    };
  };

  const foundPaperCanvas = (_paperCanvas) => {
    paperCanvas = _paperCanvas;
    console.log("paperCanvas", paperCanvas);

    const paintLayer = project.activeLayer;
    onionLayer = new project.activeLayer.constructor();
    console.log("onionLayer", onionLayer);
    onionLayer.opacity = 0.2;
    onionLayer.locked = true;
    paintLayer.activate();

    updateOnionLayer();    
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
      // Can"t show an onion skin if there is no previous skin.
      return;
    }

    const onionIndex = selectedCostume - 1;

    const vm = addon.tab.traps.onceValues.vm;
    const costume = vm.editingTarget.sprite.costumes[onionIndex];
    const asset = vm.getCostume(onionIndex);

    if (typeof paperCanvas.initializeSvg !== "function" || typeof paperCanvas.importSvg !== "function") {
      throw new Error("Assumptions invalid.");
    }

    const originalInitializeSvg = paperCanvas.initializeSvg;
    paperCanvas.initializeSvg = function (...args) {
      const paintLayer = project.activeLayer;
      onionLayer.activate();
      originalInitializeSvg.call(this, ...args);
      paintLayer.activate();
      paperCanvas.initializeSvg = originalInitializeSvg;
    };

    paperCanvas.importSvg(asset, costume.rotationCenterX, costume.rotationCenterY);
  };

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

  // https://github.com/LLK/scratch-paint/blob/develop/src/containers/paper-canvas.jsx
  Object.defineProperty(Object.prototype, "queuedImport", {
    set(value) {
      // TODO: this can and will break things
      Object.defineProperty(this, "queuedImport", {
        value: value,
        writable: true
      });
      setTimeout(() => {
        foundPaperCanvas(this);
      }, 1000);
    }
  });
}
