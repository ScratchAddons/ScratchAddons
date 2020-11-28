export default async function ({ addon, global, console, msg }) {
  let project = null;
  let paperCanvas = null;
  let onionButton = null;
  let enabled = addon.settings.get("default");
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

    // When background guide layer is added, show onion layers.
    const originalAddLayer = project.addLayer;
    project.addLayer = function (layer) {
      originalAddLayer.call(this, layer);
      if (layer.data && layer.data.isBackgroundGuideLayer) {
        let onion;
        while ((onion = storedOnionLayers.shift())) {
          originalAddLayer.call(this, onion);
        }
      }
    };

    // Scratch uses importJSON to undo or redo
    // https://github.com/LLK/scratch-paint/blob/cdf0afc217633e6cfb8ba90ea4ae38b79882cf6c/src/helper/undo.js#L37
    // The code prior to this will remove our onion layers, so we have to manually add them back.
    const originalImportJSON = project.importJSON;
    project.importJSON = function (json) {
      originalImportJSON.call(this, json);
      if (enabled) {
        updateOnionLayers();
      }
    };

    // At this point the project hasn't even finished its constructor yet, so we can't access layers yet.
    setTimeout(() => {
      const backgroundGuideLayer = project.layers.find((i) => i.data.isBackgroundGuideLayer);
      // When background guide layer is removed, hide onion layers.
      const originalRemove = backgroundGuideLayer.remove;
      backgroundGuideLayer.remove = function () {
        originalRemove.call(this);
        for (const layer of project.layers) {
          if (layer.data.sa_isOnionLayer) {
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
    };

    const originalRecalibrateSize = paperCanvas.recalibrateSize;
    paperCanvas.recalibrateSize = function (callback) {
      originalRecalibrateSize.call(this, () => {
        if (callback) callback();
        if (enabled) {
          updateOnionLayers();
        }
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
    storedOnionLayers.length = 0;
    const layers = project.layers;
    for (let i = layers.length - 1; i >= 0; i--) {
      const layer = layers[i];
      if (layer.data.sa_isOnionLayer) {
        layer.remove();
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

  const vectorLayer = (layer, costume, asset) =>
    new Promise((resolve, reject) => {
      const { rotationCenterX, rotationCenterY } = costume;
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
            if (i.className !== "PointText" && !i.children) {
              if (i.strokeWidth) {
                i.strokeWidth = i.strokeWidth * 2;
              }
            }
            i.locked = true;
            i.guide = true;
          });
          root.scale(2, new PaperConstants.Point(0, 0));

          // https://github.com/LLK/scratch-paint/blob/cdf0afc217633e6cfb8ba90ea4ae38b79882cf6c/src/containers/paper-canvas.jsx#L277-L287
          if (typeof rotationCenterX !== "undefined" && typeof rotationCenterY !== "undefined") {
            let rotationPoint = new PaperConstants.Point(rotationCenterX, rotationCenterY);
            if (viewBox && viewBox.length >= 2 && !isNaN(viewBox[0]) && !isNaN(viewBox[1])) {
              rotationPoint = rotationPoint.subtract(viewBox[0], viewBox[1]);
            }
            root.translate(PaperConstants.CENTER.subtract(rotationPoint.multiply(2)));
          } else {
            root.translate(PaperConstants.CENTER.subtract(root.bounds.width, root.bounds.height));
          }

          layer.addChild(root);
          resolve();
        },
      });
    });

  const rasterLayer = (layer, costume, asset) =>
    new Promise((resolve, reject) => {
      let { rotationCenterX, rotationCenterY } = costume;

      const raster = new PaperConstants.Raster(createCanvas(960, 720));
      raster.parent = layer;
      raster.guide = true;
      raster.locked = true;
      raster.position = PaperConstants.CENTER;

      const image = new Image();
      image.onload = () => {
        // https://github.com/LLK/scratch-paint/blob/cdf0afc217633e6cfb8ba90ea4ae38b79882cf6c/src/containers/paper-canvas.jsx#L151-L156
        if (typeof rotationCenterX === "undefined") {
          rotationCenterX = image.width / 2;
        }
        if (typeof rotationCenterY === "undefined") {
          rotationCenterY = image.height / 2;
        }

        // TODO: Scratch draws the image twice for some reason...?
        // https://github.com/LLK/scratch-paint/blob/cdf0afc217633e6cfb8ba90ea4ae38b79882cf6c/src/containers/paper-canvas.jsx#L158-L165
        raster.drawImage(image, 480 - rotationCenterX, 360 - rotationCenterY);
        resolve();
      };
      image.src = asset;
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
  };

  const updateOnionLayers = async () => {
    const selectedCostumeIndex = getSelectedCostumeIndex();
    if (selectedCostumeIndex === -1) {
      throw new Error("Couldn't find selected costume");
    }

    removeOnionLayers();
    const activeLayer = project.activeLayer;
    const vm = addon.tab.traps.onceValues.vm;

    const opacityLevels = addon.settings
      .get("opacity")
      .split(",")
      .map((i) => +i);
    const layers = addon.settings.get("layers");

    const selectedCostume = vm.editingTarget.sprite.costumes[selectedCostumeIndex];

    try {
      for (let i = selectedCostumeIndex - 1, j = 0; i >= 0 && j < layers; i--, j++) {
        const layer = createOnionLayer();
        layer.opacity = opacityLevels[j];

        const onionCostume = vm.editingTarget.sprite.costumes[i];
        const onionAsset = vm.getCostume(i);

        if (onionCostume.dataFormat === "svg") {
          await vectorLayer(layer, onionCostume, onionAsset);
        } else if (onionCostume.dataFormat === "png" || onionCostume.dataFormat === "jpg") {
          if (selectedCostume.dataFormat === "svg") {
            // Raster onion layers on a vector image currently causes weird errors and corruption.
            continue;
          }
          await rasterLayer(layer, onionCostume, onionAsset);
        }
      }
    } catch (e) {
      console.error(e);
    }

    activeLayer.activate();
  };

  const setEnabled = (_enabled) => {
    if (enabled === _enabled) {
      return;
    }
    enabled = _enabled;
    if (enabled) {
      updateOnionLayers();
    } else {
      removeOnionLayers();
    }
    onionButton.dataset.enabled = enabled;
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

  const createControls = (canvasControls) => {
    const zoomControlsContainer = canvasControls.querySelector("[class^='paint-editor_zoom-controls']");

    const controlsContainer = document.createElement("div");
    controlsContainer.className = "sa-onion-group-container";
    controlsContainer.dir = "";

    const onionControlsContainer = document.createElement("div");
    onionControlsContainer.className = zoomControlsContainer.className;
    onionControlsContainer.dir = "";

    const onionControlsGroup = document.createElement("div");
    onionControlsGroup.className = zoomControlsContainer.firstChild.className;

    onionButton = document.createElement("span");
    onionButton.className = zoomControlsContainer.firstChild.firstChild.className;
    onionButton.classList.add("sa-onion-button");
    onionButton.dataset.enabled = enabled;
    onionButton.setAttribute("role", "button");
    onionButton.addEventListener("click", () => setEnabled(!enabled));
    onionButton.title = msg("button-title");

    const img = document.createElement("img");
    img.className = zoomControlsContainer.firstChild.firstChild.firstChild.className;
    img.draggable = false;
    img.alt = msg("button-title");
    img.src = addon.self.dir + "/onion.svg";

    onionButton.appendChild(img);
    onionControlsGroup.appendChild(onionButton);
    onionControlsContainer.appendChild(onionControlsGroup);
    controlsContainer.appendChild(onionControlsContainer);
    controlsContainer.appendChild(zoomControlsContainer);
    canvasControls.appendChild(controlsContainer);
  };

  while (true) {
    const canvasControls = await addon.tab.waitForElement("[class^='paint-editor_canvas-controls']", {
      markAsSeen: true,
    });

    createControls(canvasControls);
  }
}
