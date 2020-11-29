export default async function ({ addon, global, console, msg }) {
  let project = null;
  let paperCanvas = null;
  let onionButton = null;
  const storedOnionLayers = [];
  const PaperConstants = {
    Raster: null,
    Layer: null,
    Point: null,
    Rectangle: null,
    CENTER: null,
  };
  const settings = {
    enabled: addon.settings.get("default"),
    previous: +addon.settings.get("previous"),
    next: +addon.settings.get("next"),
    opacityLevels: [+addon.settings.get("opacity0"), +addon.settings.get("opacity1"), +addon.settings.get("opacity2")],
  };

  const foundPaper = (_project) => {
    if (project === _project) {
      return;
    }
    project = _project;

    // When background guide layer is added, show onion layers.
    // https://github.com/LLK/scratch-paint/blob/cdf0afc217633e6cfb8ba90ea4ae38b79882cf6c/src/helper/layer.js#L145
    const originalAddLayer = project.addLayer;
    project.addLayer = function (layer) {
      const result = originalAddLayer.call(this, layer);
      if (layer.data.isBackgroundGuideLayer) {
        let onion;
        while ((onion = storedOnionLayers.shift())) {
          originalAddLayer.call(this, onion);
          onion.bringToFront();
        }
      }
      return result;
    };

    // Scratch uses importJSON to undo or redo
    // https://github.com/LLK/scratch-paint/blob/cdf0afc217633e6cfb8ba90ea4ae38b79882cf6c/src/helper/undo.js#L37
    // The code prior to this will remove our onion layers, so we have to manually add them back.
    const originalImportJSON = project.importJSON;
    project.importJSON = function (json) {
      const result = originalImportJSON.call(this, json);
      if (settings.enabled) {
        updateOnionLayers();
      }
      return result;
    };

    // At this point the project hasn't even finished its constructor, so we can't access layers yet.
    setTimeout(() => {
      // https://github.com/LLK/scratch-paint/blob/cdf0afc217633e6cfb8ba90ea4ae38b79882cf6c/src/helper/layer.js#L114
      // When background guide layer is removed, hide onion layers.
      const backgroundGuideLayer = project.layers.find((i) => i.data.isBackgroundGuideLayer);
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

    // importImage is called to start loading an image.
    // https://github.com/LLK/scratch-paint/blob/cdf0afc217633e6cfb8ba90ea4ae38b79882cf6c/src/containers/paper-canvas.jsx#L124
    const originalImportImage = paperCanvas.importImage;
    paperCanvas.importImage = function (...args) {
      removeOnionLayers();
      return originalImportImage.call(this, ...args);
    };

    // recalibrateSize is called when the canvas finishes loading an image.
    // all paths of importImage will result in a call to this method.
    // https://github.com/LLK/scratch-paint/blob/cdf0afc217633e6cfb8ba90ea4ae38b79882cf6c/src/containers/paper-canvas.jsx#L310-L327
    // We use this to know when to add layers.
    const originalRecalibrateSize = paperCanvas.recalibrateSize;
    paperCanvas.recalibrateSize = function (callback) {
      return originalRecalibrateSize.call(this, () => {
        if (callback) callback();
        if (settings.enabled) {
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
      image.onerror = () => {
        reject(new Error("could not load image"));
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
    // TODO: when the paint editor initially loads, this runs 3 times.

    const selectedCostumeIndex = getSelectedCostumeIndex();
    if (selectedCostumeIndex === -1) {
      throw new Error("Couldn't find selected costume");
    }

    removeOnionLayers();

    const vm = addon.tab.traps.onceValues.vm;
    if (!vm) {
      return;
    }
    const activeLayer = project.activeLayer;
    const costumes = vm.editingTarget.sprite.costumes;

    const startIndex = Math.max(0, selectedCostumeIndex - settings.previous);
    const endIndex = Math.min(costumes.length - 1, selectedCostumeIndex + settings.next);

    try {
      for (let i = startIndex; i <= endIndex; i++) {
        if (i === selectedCostumeIndex) {
          continue;
        }

        const distanceFromSelected = Math.abs(i - selectedCostumeIndex) - 1;
        const opacity = settings.opacityLevels[distanceFromSelected] / 100;

        if (!opacity) {
          // Do not make a layer at all if opacity is 0 or somehow undefined.
          continue;
        }

        const layer = createOnionLayer();
        layer.opacity = opacity;

        // Creating a new layer will automatically activate it.
        // We do not want to steal activation as doing so causes corruption.
        activeLayer.activate();

        const onionCostume = costumes[i];
        const onionAsset = vm.getCostume(i);

        if (onionCostume.dataFormat === "svg") {
          await vectorLayer(layer, onionCostume, onionAsset);
        } else if (onionCostume.dataFormat === "png" || onionCostume.dataFormat === "jpg") {
          await rasterLayer(layer, onionCostume, onionAsset);
        } else {
          throw new Error(`Unknown data format: ${onionCostume.dataFormat}`);
        }
      }
    } catch (e) {
      console.error(e);
    }

    // Regardless of any errors, we **need** to make sure the original active layer still retains activation.
    activeLayer.activate();
  };

  const setEnabled = (_enabled) => {
    if (settings.enabled === _enabled) {
      return;
    }
    settings.enabled = _enabled;
    if (settings.enabled) {
      updateOnionLayers();
    } else {
      removeOnionLayers();
    }
    onionButton.dataset.enabled = settings.enabled;
  };

  const settingsChanged = () => {
    if (settings.enabled) {
      updateOnionLayers();
    }
  };

  const installPrototypeHacks = () => {
    // https://github.com/LLK/paper.js/blob/16d5ff0267e3a0ef647c25e58182a27300afad20/src/item/Project.js#L64-L65
    Object.defineProperty(Object.prototype, "_view", {
      set(value) {
        Object.defineProperty(this, "_view", {
          value: value,
          writable: true,
          enumerable: true,
          configurable: true,
        });
        if (
          typeof this.activeLayer === "object" &&
          Array.isArray(this.layers) &&
          typeof this.addLayer === "function" &&
          typeof this.importJSON === "function" &&
          typeof this.importSVG === "function"
        ) {
          foundPaper(this);
        }
      },
    });

    // https://github.com/LLK/scratch-paint/blob/cdf0afc217633e6cfb8ba90ea4ae38b79882cf6c/src/containers/paper-canvas.jsx#L45-L51
    // In Scratch, this block should always run.
    Object.defineProperty(Object.prototype, "shouldZoomToFit", {
      set(value) {
        Object.defineProperty(this, "shouldZoomToFit", {
          value: value,
          writable: true,
          enumerable: true,
          configurable: true,
        });
        if (typeof this.importImage === "function" && typeof this.recalibrateSize === "function") {
          foundPaperCanvas(this);
        }
      },
    });
  };

  const createControls = (canvasControls) => {
    const zoomControlsContainer = canvasControls.querySelector("[class^='paint-editor_zoom-controls']");
    const canvasContainer = document.querySelector("[class^='paint-editor_canvas-container']");

    // Buttons

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
    onionButton.dataset.enabled = settings.enabled;
    onionButton.setAttribute("role", "button");
    onionButton.addEventListener("click", () => setEnabled(!settings.enabled));
    onionButton.title = msg("onion");

    const onionImage = document.createElement("img");
    onionImage.className = zoomControlsContainer.firstChild.firstChild.firstChild.className;
    onionImage.draggable = false;
    onionImage.alt = msg("onion");
    onionImage.src = addon.self.dir + "/onion.svg";

    const settingButton = document.createElement("span");
    settingButton.className = onionButton.className;
    settingButton.setAttribute("role", "button");
    settingButton.addEventListener("click", () => setSettingsOpen(!areSettingsOpen()));
    settingButton.title = msg("settings");

    const settingImage = document.createElement("img");
    settingImage.className = onionImage.className;
    settingImage.draggable = false;
    settingImage.alt = msg("settings");
    settingImage.src = addon.self.dir + "/settings.svg";

    onionButton.appendChild(onionImage);
    settingButton.appendChild(settingImage);
    onionControlsGroup.appendChild(onionButton);
    onionControlsGroup.appendChild(settingButton);
    onionControlsContainer.appendChild(onionControlsGroup);
    controlsContainer.appendChild(onionControlsContainer);
    controlsContainer.appendChild(zoomControlsContainer);
    canvasControls.appendChild(controlsContainer);

    // Settings

    const settingsPage = document.createElement("div");
    settingsPage.classList.add("sa-onion-settings");

    const setSettingsOpen = (open) => {
      settingButton.dataset.enabled = open;
      if (open) {
        canvasContainer.appendChild(settingsPage);
      } else {
        settingsPage.parentNode.removeChild(settingsPage);
      }
    };
    const areSettingsOpen = () => !!settingsPage.parentNode;

    const settingsHeader = document.createElement("div");
    settingsHeader.className = "sa-onion-settings-header";
    settingsHeader.textContent = msg("settings");

    const setInputValueToNumber = (e) => {
      if (e.target.checkValidity()) {
        e.target.value = +e.target.value;
      }
    };

    const previousContainer = document.createElement("label");
    previousContainer.className = "sa-onion-settings-group";
    previousContainer.appendChild(document.createTextNode(msg("previous")));
    const previousInput = document.createElement("input");
    previousInput.type = "number";
    previousInput.min = "0";
    previousInput.max = "3";
    previousInput.step = "1";
    previousInput.value = settings.previous;
    previousInput.addEventListener("input", (e) => {
      if (e.target.checkValidity()) {
        settings.previous = +e.target.value;
        settingsChanged();
      }
    });
    previousInput.addEventListener("blur", setInputValueToNumber);

    const nextContainer = document.createElement("label");
    nextContainer.className = "sa-onion-settings-group";
    nextContainer.appendChild(document.createTextNode(msg("next")));
    const nextInput = document.createElement("input");
    nextInput.type = "number";
    nextInput.min = "0";
    nextInput.max = "3";
    nextInput.step = "1";
    nextInput.value = settings.next;
    nextInput.addEventListener("input", (e) => {
      if (e.target.checkValidity()) {
        settings.next = +e.target.value;
        settingsChanged();
      }
    });
    nextInput.addEventListener("blur", setInputValueToNumber);

    const opacityContainer = document.createElement("div");
    opacityContainer.className = "sa-onion-settings-group";
    opacityContainer.appendChild(document.createTextNode("Opacity %: "));
    for (let i = 0; i < 3; i++) {
      const input = document.createElement("input");
      input.type = "number";
      input.min = "0";
      input.max = "100";
      input.step = "1";
      input.value = settings.opacityLevels[i];
      input.addEventListener("blur", setInputValueToNumber);
      input.addEventListener("input", (e) => {
        if (e.target.checkValidity()) {
          settings.opacityLevels[i] = +e.target.value;
          settingsChanged();
        }
      });
      opacityContainer.appendChild(input);
    }

    previousContainer.appendChild(previousInput);
    nextContainer.appendChild(nextInput);
    settingsPage.appendChild(settingsHeader);
    settingsPage.appendChild(previousContainer);
    settingsPage.appendChild(nextContainer);
    settingsPage.appendChild(opacityContainer);
  };

  const controlsLoop = async () => {
    while (true) {
      const canvasControls = await addon.tab.waitForElement("[class^='paint-editor_canvas-controls']", {
        markAsSeen: true,
      });

      createControls(canvasControls);
    }
  };

  if (addon.tab.editorMode === "editor") {
    installPrototypeHacks();
  } else {
    const listener = () => {
      if (addon.tab.editorMode === "editor") {
        installPrototypeHacks();
        addon.tab.removeEventListener("urlChange", listener);
      }
    };
    addon.tab.addEventListener("urlChange", listener);
  }

  controlsLoop();
}
