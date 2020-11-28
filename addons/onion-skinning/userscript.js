export default async function ({ addon, global, console }) {
  let project;
  let paperCanvas;

  const PaperConstants = {
    Raster: null,
    Layer: null,
    Point: null,
    Rectangle: null,
    CENTER: null,
  };

  const foundPaper = (_project) => {
    if (project === _project) {
      return;
    }
    project = _project;
    console.log("project", _project);

    const originalExportSVG = project.exportSVG;
    project.exportSVG = function (...args) {
      const onionLayers = [];
      for (const layer of this.layers) {
        if (layer.data.sa_isOnionLayer) {
          onionLayers.push(layer);
        }
      }
      for (const layer of onionLayers) {
        layer.remove();
      }
      const result = originalExportSVG.call(this, ...args);
      for (const layer of onionLayers) {
        this.addLayer(layer);
      }
      return result;
    };

    if (PaperConstants.Layer === null) {
      setTimeout(() => {
        PaperConstants.Layer = project.activeLayer.constructor;

        const rasterLayer = project.layers.find((i) => i.data.isRasterLayer);
        PaperConstants.Raster = rasterLayer.children[0].constructor;

        PaperConstants.Point = rasterLayer.position.constructor;

        PaperConstants.Rectangle = rasterLayer.getBounds().constructor;

        PaperConstants.CENTER = new PaperConstants.Point(480, 360);
      });
    }
  };

  const foundPaperCanvas = (_paperCanvas) => {
    if (paperCanvas === _paperCanvas) {
      return;
    }
    paperCanvas = _paperCanvas;
    console.log("paperCanvas", paperCanvas);

    // When importing a new image, remove onion layers.
    const originalImportImage = paperCanvas.importImage;
    paperCanvas.importImage = function (...args) {
      removeOnionLayers();
      originalImportImage.call(this, ...args);
      setTimeout(() => {
        updateOnionLayers();
      });
    };
  };

  const createCanvas = (width, height) => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas.getContext("2d").imageSmoothingEnabled = false;
    return canvas;
  };

  const createOnionLayer = () => {
    const layer = new PaperConstants.Layer();
    layer.opacity = 0.2;
    layer.locked = true;
    layer.guide = true;
    layer.data.sa_isOnionLayer = true;
    return layer;
  };

  const removeOnionLayers = () => {
    if (!project) {
      return;
    }
    const layers = project.layers;
    for (let i = layers.length - 1; i >= 0; i--) {
      if (layers[i].data.sa_isOnionLayer) {
        layers[i].remove();
      }
    }
  };

  const recurseItem = (item, callback) => {
    if (item.children) {
      for (const child of item.children) {
        recurseItem(child, callback);
      }
    }
    callback(item);
  };

  const updateOnionLayers = () => {
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

    removeOnionLayers();

    const activeLayer = project.activeLayer;

    if (costume.dataFormat === "svg") {
      const layer = createOnionLayer();
      layer.activate();
  
      const originalRecalibrate = paperCanvas.recalibrateSize;
      paperCanvas.recalibrateSize = function (callback) {
        originalRecalibrate.call(this, function () {
          if (callback) callback();
          activeLayer.activate();
          paperCanvas.recalibrateSize = originalRecalibrate;
          recurseItem(layer, (item) => {
            item.locked = true;
            item.guide = true;
          });
        });
      };
    
      paperCanvas.importSvg(asset, costume.rotationCenterX, costume.rotationCenterY);
    } else if (costume.dataFormat === "png" || costume.dataFormat === "jpg") {
      const layer = createOnionLayer();
      const raster = new PaperConstants.Raster(createCanvas(960, 720));
      raster.parent = layer;
      raster.guide = true;
      raster.locked = true;
      raster.position = PaperConstants.CENTER;

      const mask = new PaperConstants.Rectangle(layer.getBounds());
      mask.guide = true;
      mask.locked = true;
      mask.clipMask = true;

      const image = new Image();
      image.onload = () => {
        raster.drawImage(image, 480 - costume.rotationCenterX, 360 - costume.rotationCenterY);
        activeLayer.activate();
      };
      image.src = asset;
    }
  };

  // https://github.com/LLK/paper.js/blob/16d5ff0267e3a0ef647c25e58182a27300afad20/src/item/Project.js#L64-L65
  Object.defineProperty(Object.prototype, "_view", {
    set(value) {
      // TODO: this can and will break things
      Object.defineProperty(this, "_view", {
        value: value,
        writable: true,
      });
      foundPaper(this);
    },
  });

  // https://github.com/LLK/scratch-paint/blob/cdf0afc217633e6cfb8ba90ea4ae38b79882cf6c/src/containers/paper-canvas.jsx#L45-L51
  Object.defineProperty(Object.prototype, "shouldZoomToFit", {
    set(value) {
      // TODO: this can and will break things
      Object.defineProperty(this, "shouldZoomToFit", {
        value: value,
        writable: true,
      });
      foundPaperCanvas(this);
    },
  });
}
