export default async function ({ addon, global, console }) {
  let project;
  let paperCanvas;

  const storedOnionLayers = [];

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

    const originalAddLayer = project.addLayer;
    project.addLayer = function (layer) {
      originalAddLayer.call(this, layer);
      // When background guide layer is added, show onion layers.
      if (layer.data && layer.data.isBackgroundGuideLayer) {
        let onion;
        while ((onion = storedOnionLayers.shift())) {
          originalAddLayer.call(this, onion);
        }
      }
    };

    const originalImportJSON = project.importJSON;
    project.importJSON = function (json) {
      originalImportJSON.call(this, json);
      updateOnionLayers();
    };

    setTimeout(() => {
      const backgroundGuideLayer = project.layers.find((i) => i.data.isBackgroundGuideLayer);
      const originalRemove = backgroundGuideLayer.remove;
      backgroundGuideLayer.remove = function () {
        originalRemove.call(this);
        // When background guide layer is removed, hide onion layers.
        for (const layer of project.layers) {
          if (layer.data && layer.data.sa_isOnionLayer) {
            storedOnionLayers.push(layer);
          }
        }
        for (const layer of storedOnionLayers) {
          layer.remove();
        }
      };

      if (PaperConstants.Layer === null) {
        PaperConstants.Layer = project.activeLayer.constructor;

        const rasterLayer = project.layers.find((i) => i.data.isRasterLayer);
        PaperConstants.Raster = rasterLayer.children[0].constructor;
        PaperConstants.Point = rasterLayer.position.constructor;
        PaperConstants.Rectangle = rasterLayer.getBounds().constructor;

        PaperConstants.CENTER = new PaperConstants.Point(480, 360);
      }
    });
  };

  const foundPaperCanvas = (_paperCanvas) => {
    if (paperCanvas === _paperCanvas) {
      return;
    }
    paperCanvas = _paperCanvas;

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
    storedOnionLayers.length = 0;
    const layers = project.layers;
    for (let i = layers.length - 1; i >= 0; i--) {
      if (layers[i].data.sa_isOnionLayer) {
        layers[i].remove();
      }
    }
  };

  const recursePaperItem = (item, callback) => {
    if (item.children) {
      for (const child of item.children) {
        recursePaperItem(child, callback);
      }
    }
    callback(item);
  };

  const addOnionLayer = (index, opacity) =>
    new Promise((resolve, reject) => {
      const vm = addon.tab.traps.onceValues.vm;
      const costume = vm.editingTarget.sprite.costumes[index];
      const {dataFormat, rotationCenterX, rotationCenterY} = costume;
      let asset = vm.getCostume(index);

      const layer = createOnionLayer();
      layer.opacity = opacity;

      if (dataFormat === "svg") {
        // https://github.com/LLK/scratch-paint/blob/cdf0afc217633e6cfb8ba90ea4ae38b79882cf6c/src/containers/paper-canvas.jsx#L196-L218
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
          onLoad: (root) => {
            if (!root) {
              reject(new Error("could not load onion skin"));
              return;
            }

            root.remove();

            // https://github.com/LLK/scratch-paint/blob/cdf0afc217633e6cfb8ba90ea4ae38b79882cf6c/src/containers/paper-canvas.jsx#L269-L272
            if (root.children && root.children.length === 1) {
              root = root.reduce();
            }

            // https://github.com/LLK/scratch-paint/blob/cdf0afc217633e6cfb8ba90ea4ae38b79882cf6c/src/containers/paper-canvas.jsx#L274-L275
            recursePaperItem(root, (i) => {
              if (i.className === "PathItem") {
                i.clockwise = true;
              }
              if (i.className !== "PointText") {
                if (i.strokeWidth) {
                  i.strokeWidth = i.strokeWidth * 2;
                }
              }
              i.locked = true;
              i.guide = true;
            });
            root.scale(2, new PaperConstants.Point(0, 0));

            // https://github.com/LLK/scratch-paint/blob/cdf0afc217633e6cfb8ba90ea4ae38b79882cf6c/src/containers/paper-canvas.jsx#L277-L287
            let rotationPoint = new PaperConstants.Point(rotationCenterX, rotationCenterY);
            if (viewBox && viewBox.length >= 2 && !isNaN(viewBox[0]) && !isNaN(viewBox[1])) {
              rotationPoint = rotationPoint.subtract(viewBox[0], viewBox[1]);
            }
            root.translate(PaperConstants.CENTER.subtract(rotationPoint.multiply(2)));

            layer.addChild(root);
            resolve();
          },
        });
      } else if (dataFormat === "png" || dataFormat === "jpg") {
        const raster = new PaperConstants.Raster(createCanvas(960, 720));
        raster.parent = layer;
        raster.guide = true;
        raster.locked = true;
        raster.position = PaperConstants.CENTER;

        const image = new Image();
        image.onload = () => {
          // TODO: Scratch draws the image twice for some reason...?
          // https://github.com/LLK/scratch-paint/blob/cdf0afc217633e6cfb8ba90ea4ae38b79882cf6c/src/containers/paper-canvas.jsx#L158-L165
          raster.drawImage(image, 480 - rotationCenterX, 360 - rotationCenterY);
          resolve();
        };
        image.src = asset;
      }
    });

  const getSelectedCostumeIndex = () => {
    const costumeList = Array.from(document.querySelector("[class^='selector_list-area']").children);
    for (let i = 0; i < costumeList.length; i++) {
      const item = costumeList[i].firstChild;
      if (item && item.className.includes("is-selected")) {
        return i;
      }
    }
    return -1;
  }

  const updateOnionLayers = async () => {
    const selectedCostumeIndex = getSelectedCostumeIndex();
    if (selectedCostumeIndex === -1) {
      throw new Error("Couldn't find selected costume");
    }

    const activeLayer = project.activeLayer;
    removeOnionLayers();

    const OPACITY = [
      // TODO: configurable
      0.25,
      0.15,
      0.05,
    ];

    const LAYERS = 1; // TODO: configurable
    // const LAYERS = 3;

    try {
      for (let i = selectedCostumeIndex - 1, j = 0; i >= 0 && j < LAYERS; i--, j++) {
        await addOnionLayer(i, OPACITY[j]);
      }
    } catch (e) {
      console.error(e);
    }

    activeLayer.activate();
  };

  // TODO: button :)

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
