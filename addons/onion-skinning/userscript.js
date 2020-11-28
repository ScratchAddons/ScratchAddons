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

  const recursePaperItem = (item, callback) => {
    if (item.className === "Group") {
      for (const child of item.children) {
        recursePaperItem(child, callback);
      }
    } else {
      callback(item);
    }
  };

  // Make item clockwise. Drill down into groups.
  const ensureClockwise = function (root) {
    recursePaperItem(root, (item) => {
      if (item.className === "PathItem") {
        item.clockwise = true;
      }
    });
  };

  // Scale item and its strokes by factor
  const scaleWithStrokes = function (root, factor, pivot) {
    recursePaperItem(root, (item) => {
      if (item.className === "PointText") {
        // Text outline size is controlled by text transform matrix, thus it's already scaled.
        return;
      }
      if (item.strokeWidth) {
        item.strokeWidth = item.strokeWidth * factor;
      }
    });
    root.scale(factor, pivot);
  };

  const addOnionLayer = (index, opacity) =>
    new Promise((resolve, reject) => {
      const vm = addon.tab.traps.onceValues.vm;
      const costume = vm.editingTarget.sprite.costumes[index];
      let asset = vm.getCostume(index);

      const layer = createOnionLayer();
      layer.opacity = opacity;

      if (costume.dataFormat === "svg") {
        asset = asset.split(/<\s*svg:/).join("<");
        asset = asset.split(/<\/\s*svg:/).join("</");
        const svgAttrs = asset.match(/<svg [^>]*>/);
        if (svgAttrs && svgAttrs[0].indexOf("xmlns=") === -1) {
          asset = asset.replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" ');
        }
        const parser = new DOMParser();
        const svgDom = parser.parseFromString(asset, "text/xml");
        const viewBox = svgDom.documentElement.attributes.viewBox
          ? svgDom.documentElement.attributes.viewBox.value.match(/\S+/g)
          : null;
        if (viewBox) {
          for (let i = 0; i < viewBox.length; i++) {
            viewBox[i] = parseFloat(viewBox[i]);
          }
        }

        project.importSVG(asset, {
          expandShapes: true,
          onLoad: (item) => {
            if (!item) {
              reject(new Error("could not load onion skin"));
              return;
            }
            item.remove();

            ensureClockwise(item);
            scaleWithStrokes(item, 2, new PaperConstants.Point(0, 0));
            recursePaperItem(item, (i) => {
              i.locked = true;
              i.guide = true;
            });

            let rotationPoint = new PaperConstants.Point(costume.rotationCenterX, costume.rotationCenterY);
            if (viewBox && viewBox.length >= 2 && !isNaN(viewBox[0]) && !isNaN(viewBox[1])) {
              rotationPoint = rotationPoint.subtract(viewBox[0], viewBox[1]);
            }
            item.translate(PaperConstants.CENTER.subtract(rotationPoint.multiply(2)));

            layer.addChild(item);
            resolve();
          },
        });
      } else if (costume.dataFormat === "png" || costume.dataFormat === "jpg") {
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
          resolve();
        };
        image.src = asset;
      }
    });

  const updateOnionLayers = async () => {
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

    const activeLayer = project.activeLayer;
    removeOnionLayers();

    const OPACITY = [
      // TODO: configurable
      0.5,
      0.2,
      0.1,
    ];

    const LAYERS = 1; // TODO: configurable
    // const LAYERS = 3;

    for (let i = selectedCostume - 1, j = 0; i >= 0 && j < LAYERS; i--, j++) {
      await addOnionLayer(i, OPACITY[j]);
    }

    activeLayer.activate();
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
