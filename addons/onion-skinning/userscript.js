export default async function ({ addon, global, console, msg }) {
  const paper = await addon.tab.traps.getPaper();

  const paintEditorCanvasContainer = await addon.tab.waitForElement("[class^='paint-editor_canvas-container']");
  try {
    if (!("colorIndex" in addon.tab.redux.state.scratchPaint.fillMode)) {
      console.error("Detected new paint editor; this will be supported in future versions.");
      return;
    }
  } catch (_) {
    // The check can technically fail when Redux isn't supported (rare cases)
    // Just ignore in this case
  }
  const paperCanvas =
    paintEditorCanvasContainer[addon.tab.traps.getInternalKey(paintEditorCanvasContainer)].child.child.child.stateNode;

  let paperCenter;
  const storedOnionLayers = [];

  const parseHexColor = (color) => {
    const hexString = color.substr(1);
    const hexNumber = parseInt(hexString, 16);
    return [
      (hexNumber >> 16) & 0xff, // R
      (hexNumber >> 8) & 0xff, // G
      hexNumber & 0xff, // B
    ];
  };

  const settings = {
    enabled: addon.settings.get("default") && !addon.self.disabled,
    previous: +addon.settings.get("previous"),
    next: +addon.settings.get("next"),
    opacity: +addon.settings.get("opacity"),
    opacityStep: +addon.settings.get("opacityStep"),
    layering: addon.settings.get("layering"),
    mode: addon.settings.get("mode"),
    beforeTint: parseHexColor(addon.settings.get("beforeTint")),
    afterTint: parseHexColor(addon.settings.get("afterTint")),
  };

  const injectPaper = () => {
    const backgroundGuideLayer = paper.project.layers.find((i) => i.data.isBackgroundGuideLayer);
    paperCenter = backgroundGuideLayer.children[0].position;

    // When background guide layer is added, show onion layers.
    // https://github.com/LLK/scratch-paint/blob/cdf0afc217633e6cfb8ba90ea4ae38b79882cf6c/src/helper/layer.js#L145
    const originalAddLayer = paper.Project.prototype.addLayer;
    paper.Project.prototype.addLayer = function (layer) {
      const result = originalAddLayer.call(this, layer);
      if (layer.data.isBackgroundGuideLayer) {
        let onion;
        while ((onion = storedOnionLayers.shift())) {
          originalAddLayer.call(this, onion);
        }
        relayerOnionLayers();
      }
      return result;
    };

    // Scratch uses importJSON to undo or redo
    // https://github.com/LLK/scratch-paint/blob/cdf0afc217633e6cfb8ba90ea4ae38b79882cf6c/src/helper/undo.js#L37
    // The code prior to this will remove our onion layers, so we have to manually add them back.
    const originalImportJSON = paper.Project.prototype.importJSON;
    paper.Project.prototype.importJSON = function (json) {
      const result = originalImportJSON.call(this, json);
      if (settings.enabled) {
        updateOnionLayers();
      }
      return result;
    };

    // https://github.com/LLK/scratch-paint/blob/cdf0afc217633e6cfb8ba90ea4ae38b79882cf6c/src/helper/layer.js#L114
    // When background guide layer is removed, hide onion layers.
    const originalRemoveLayer = paper.Layer.prototype.remove;
    paper.Layer.prototype.remove = function () {
      if (this.data.isBackgroundGuideLayer) {
        for (const layer of paper.project.layers) {
          if (layer.data.sa_isOnionLayer) {
            storedOnionLayers.push(layer);
          }
        }
        for (const layer of storedOnionLayers) {
          layer.remove();
        }
      }
      return originalRemoveLayer.call(this);
    };
  };

  const injectPaperCanvas = () => {
    let expectingImport = false;

    const PaperCanvas = paperCanvas.constructor;

    // importImage is called to start loading an image.
    // https://github.com/LLK/scratch-paint/blob/cdf0afc217633e6cfb8ba90ea4ae38b79882cf6c/src/containers/paper-canvas.jsx#L124
    const originalImportImage = PaperCanvas.prototype.importImage;
    PaperCanvas.prototype.importImage = function (...args) {
      expectingImport = true;
      removeOnionLayers();
      return originalImportImage.call(this, ...args);
    };

    // recalibrateSize is called when the canvas finishes loading an image.
    // all paths of importImage will result in a call to this method.
    // https://github.com/LLK/scratch-paint/blob/cdf0afc217633e6cfb8ba90ea4ae38b79882cf6c/src/containers/paper-canvas.jsx#L310-L327
    // We use this to know when to add layers.
    const originalRecalibrateSize = PaperCanvas.prototype.recalibrateSize;
    PaperCanvas.prototype.recalibrateSize = function (callback) {
      return originalRecalibrateSize.call(this, () => {
        if (callback) callback();
        if (expectingImport) {
          expectingImport = false;
          if (settings.enabled) {
            updateOnionLayers();
          }
        }
      });
    };

    // Prototype overrides will work for all future instances, but Scratch manually binds some methods to `this`
    // so we have to manually copy them for the current instance (but not future instances)
    paperCanvas.recalibrateSize = PaperCanvas.prototype.recalibrateSize.bind(paperCanvas);
    paperCanvas.importImage = PaperCanvas.prototype.importImage.bind(paperCanvas);
  };

  const createOnionLayer = () => {
    const layer = new paper.Layer();
    layer.locked = true;
    layer.guide = true;
    layer.data.sa_isOnionLayer = true;
    return layer;
  };

  // Each onion layer update is given an ID
  // Because updating layers is async, we need this to cancel all but the most recent update
  let globalUpdateId = 0;
  const cancelOngoingUpdatesAndGetNewId = () => ++globalUpdateId;

  const removeOnionLayers = () => {
    cancelOngoingUpdatesAndGetNewId();

    const project = paper.project;
    if (!project) {
      return;
    }

    storedOnionLayers.length = 0;
    const layers = project.layers;
    // Iterate downward because we remove items mid-iteration
    for (let i = layers.length - 1; i >= 0; i--) {
      const layer = layers[i];
      if (layer.data.sa_isOnionLayer) {
        layer.remove();
      }
    }
  };

  const relayerOnionLayers = () => {
    const project = paper.project;
    if (!project) {
      return;
    }
    const onionLayer = project.layers.find((i) => i.data.sa_isOnionLayer);
    if (!onionLayer) {
      return;
    }
    if (settings.layering === "front") {
      project.addLayer(onionLayer);
    } else {
      const rasterLayer = project.layers.find((i) => i.data.isRasterLayer);
      if (rasterLayer.index === 0) {
        project.insertLayer(0, onionLayer);
      } else {
        project.insertLayer(1, onionLayer);
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

  const getTint = (red, green, blue, isBefore) => {
    const referenceColor = isBefore ? settings.beforeTint : settings.afterTint;
    const colorAverage = (red + green + blue) / 3 / 255;
    const WEIGHT = 1.5;
    const weighted = colorAverage / WEIGHT + (1 - 1 / WEIGHT);
    return [referenceColor[0] * weighted, referenceColor[1] * weighted, referenceColor[2] * weighted];
  };

  const toHexColor = ([red, green, blue]) => {
    const r = Math.round(red).toString(16).padStart(2, "0");
    const g = Math.round(green).toString(16).padStart(2, "0");
    const b = Math.round(blue).toString(16).padStart(2, "0");
    return `#${r}${g}${b}`;
  };

  const getPaperColorTint = (color, isBefore) =>
    toHexColor(getTint(color.red * 255, color.green * 255, color.blue * 255, isBefore));

  const tintRaster = (raster, isBefore) => {
    const { width, height } = raster.canvas;
    const context = raster.context;
    // TODO: check to see if this is a performance issue
    const imageData = context.getImageData(0, 0, width, height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4 /* RGBA */) {
      const red = data[i + 0];
      const green = data[i + 1];
      const blue = data[i + 2];
      const alpha = data[i + 3];
      if (alpha === 0) {
        continue;
      }
      const newTint = getTint(red, green, blue, isBefore);
      data[i + 0] = newTint[0];
      data[i + 1] = newTint[1];
      data[i + 2] = newTint[2];
    }
    context.putImageData(imageData, 0, 0);
  };

  const waitForAllRastersToLoad = (root) => {
    const promises = [];
    recursePaperItem(root, (item) => {
      if (item instanceof paper.Raster) {
        promises.push(
          new Promise((resolve, reject) => {
            item.on("load", () => resolve());
            item.on("error", () => reject(new Error("Raster inside SVG failed to load")));
          })
        );
      }
    });
    return Promise.all(promises);
  };

  const rasterizeVector = (root) => {
    const bounds = root.strokeBounds;
    const { width, height } = bounds;

    // Some browsers experience extremely poor performance when this value exceeds 3840.
    const MAX_SIZE = 3000;
    const maxScale = Math.min(MAX_SIZE / width, MAX_SIZE / height);

    const raster = new paper.Raster(new paper.Size(width, height));
    raster.remove();
    raster.smoothing = true;

    raster.guide = true;
    raster.locked = true;

    let renderedAtScale = 0;
    const originalDraw = raster.draw;
    raster.draw = function (...args) {
      const displayedSize = this.getView().getZoom() * window.devicePixelRatio;
      const newScale = Math.max(1, Math.min(maxScale, 2 ** Math.ceil(Math.log2(displayedSize))));
      if (newScale > renderedAtScale) {
        renderedAtScale = newScale;
        const canvas = this.canvas;
        const ctx = this.context;

        // Based on https://github.com/LLK/paper.js/blob/16d5ff0267e3a0ef647c25e58182a27300afad20/src/item/Item.js#L1761
        const scaledWidth = width * newScale;
        const scaledHeight = height * newScale;
        canvas.width = scaledWidth;
        canvas.height = scaledHeight;

        this._size = new paper.Size(scaledWidth, scaledHeight);
        const topLeft = bounds.getTopLeft().floor();
        const bottomRight = bounds.getBottomRight().ceil();
        const size = new paper.Size(bottomRight.subtract(topLeft));
        const matrix = new paper.Matrix().scale(newScale).translate(topLeft.negate());
        ctx.save();
        matrix.applyToContext(ctx);
        root.draw(
          ctx,
          new paper.Base({
            matrices: [matrix],
          })
        );
        ctx.restore();
        this.matrix.reset();
        this.transform(new paper.Matrix().translate(topLeft.add(size.divide(2))).scale(1 / newScale));
      }

      return originalDraw.call(this, ...args);
    };

    return raster;
  };

  const makeVectorOnion = (opacity, costume, asset, isBefore) =>
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

      const handleLoad = (root) => {
        root.opacity = opacity;

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
        root.scale(2, new paper.Point(0, 0));

        if (settings.mode === "tint") {
          const gradients = new Set();
          recursePaperItem(root, (i) => {
            if (i.strokeColor) {
              i.strokeColor = getPaperColorTint(i.strokeColor, isBefore);
            }
            if (i.fillColor) {
              const gradient = i.fillColor.gradient;
              if (gradient) {
                if (gradients.has(gradient)) return;
                gradients.add(gradient);
                for (const stop of gradient.stops) {
                  stop.color = getPaperColorTint(stop.color, isBefore);
                }
              } else {
                i.fillColor = getPaperColorTint(i.fillColor, isBefore);
              }
            }
            if (i.canvas) {
              tintRaster(i, isBefore);
            }
          });
        }

        // https://github.com/LLK/scratch-paint/blob/cdf0afc217633e6cfb8ba90ea4ae38b79882cf6c/src/containers/paper-canvas.jsx#L277-L287
        if (typeof rotationCenterX !== "undefined" && typeof rotationCenterY !== "undefined") {
          let rotationPoint = new paper.Point(rotationCenterX, rotationCenterY);
          if (viewBox && viewBox.length >= 2 && !isNaN(viewBox[0]) && !isNaN(viewBox[1])) {
            rotationPoint = rotationPoint.subtract(viewBox[0], viewBox[1]);
          }
          root.translate(paperCenter.subtract(rotationPoint.multiply(2)));
        } else {
          root.translate(paperCenter.subtract(root.bounds.width, root.bounds.height));
        }

        return rasterizeVector(root);
      };

      paper.project.importSVG(asset, {
        expandShapes: true,
        insert: false,
        onLoad: (root) => {
          if (!root) {
            reject(new Error("could not load onion skin"));
            return;
          }
          resolve(waitForAllRastersToLoad(root).then(() => handleLoad(root)));
        },
      });
    });

  const makeRasterOnion = (opacity, costume, asset, isBefore) =>
    new Promise((resolve, reject) => {
      let { rotationCenterX, rotationCenterY } = costume;

      const image = new Image();
      image.onload = () => {
        const width = Math.min(paperCenter.x * 2, image.width);
        const height = Math.min(paperCenter.y * 2, image.height);

        // https://github.com/LLK/scratch-paint/blob/cdf0afc217633e6cfb8ba90ea4ae38b79882cf6c/src/containers/paper-canvas.jsx#L151-L156
        if (typeof rotationCenterX === "undefined") {
          rotationCenterX = width / 2;
        }
        if (typeof rotationCenterY === "undefined") {
          rotationCenterY = height / 2;
        }

        const raster = new paper.Raster(image);
        raster.opacity = opacity;
        raster.guide = true;
        raster.locked = true;
        const x = width / 2 + (paperCenter.x - rotationCenterX);
        const y = height / 2 + (paperCenter.y - rotationCenterY);
        raster.position = new paper.Point(x, y);
        raster.remove();

        if (settings.mode === "tint") {
          tintRaster(raster, isBefore);
        }

        resolve(raster);
      };
      image.onerror = () => {
        reject(new Error("could not load image"));
      };
      image.src = asset;
    });

  const getSelectedCostumeIndex = () => {
    const item = document.querySelector("[class*='selector_list-item'][class*='sprite-selector-item_is-selected']");
    if (!item) return -1;
    const numberEl = item.querySelector("[class*='sprite-selector-item_number']");
    if (!numberEl) return -1;
    return +numberEl.textContent - 1;
  };

  const updateOnionLayers = async () => {
    const project = paper.project;
    if (!project) {
      return;
    }

    const selectedCostumeIndex = getSelectedCostumeIndex();
    if (selectedCostumeIndex === -1) {
      return;
    }

    removeOnionLayers();

    const localUpdateId = cancelOngoingUpdatesAndGetNewId();

    const vm = addon.tab.traps.vm;
    if (!vm) {
      return;
    }
    const originalActiveLayer = project.activeLayer;
    const costumes = vm.editingTarget.sprite.costumes;

    const startIndex = Math.max(0, selectedCostumeIndex - settings.previous);
    const endIndex = Math.min(costumes.length - 1, selectedCostumeIndex + settings.next);

    try {
      const layersToCreate = [];
      for (let i = startIndex; i <= endIndex; i++) {
        if (i === selectedCostumeIndex) {
          continue;
        }
        const isBefore = i < selectedCostumeIndex;
        const distance = Math.abs(i - selectedCostumeIndex) - 1;
        const opacity = (settings.opacity - settings.opacityStep * distance) / 100;
        if (opacity <= 0) {
          continue;
        }
        layersToCreate.push({
          index: i,
          isBefore,
          opacity,
        });
      }

      const onions = await Promise.all(
        layersToCreate.map(({ index, isBefore, opacity }) => {
          const onionCostume = costumes[index];
          const onionAsset = vm.getCostume(index);

          if (onionCostume.dataFormat === "svg") {
            return makeVectorOnion(opacity, onionCostume, onionAsset, isBefore);
          } else if (onionCostume.dataFormat === "png" || onionCostume.dataFormat === "jpg") {
            return makeRasterOnion(opacity, onionCostume, onionAsset, isBefore);
          } else {
            throw new Error(`Unknown data format: ${onionCostume.dataFormat}`);
          }
        })
      );

      // Make sure we haven't been cancelled
      if (globalUpdateId === localUpdateId) {
        const layer = createOnionLayer();
        for (const item of onions) {
          layer.addChild(item);
        }
        relayerOnionLayers();
      }
    } catch (e) {
      console.error(e);
    }

    // We must make sure to always reset the active layer to avoid corruption.
    originalActiveLayer.activate();
  };

  const setEnabled = (_enabled) => {
    if (settings.enabled === _enabled) {
      return;
    }
    settings.enabled = _enabled;
    if (settings.enabled) {
      if (settings.next === 0 && settings.previous === 0) {
        settings.previous = 1;
        layerInputs.previous.value = settings.previous;
      }
      if (settings.opacity === 0) {
        settings.opacity = 25;
        layerInputs.opacity.value = settings.opacity;
      }
      updateOnionLayers();
    } else {
      removeOnionLayers();
    }
    toggleButton.dataset.enabled = settings.enabled;
  };

  //
  // Controls below editor
  //

  const settingsChanged = (onlyRelayerNeeded) => {
    if ((settings.previous === 0 && settings.next === 0) || settings.opacity === 0) {
      setEnabled(false);
      return;
    }
    if (settings.enabled) {
      if (onlyRelayerNeeded) {
        relayerOnionLayers();
      } else {
        updateOnionLayers();
      }
    } else if (settings.previous > 0 || settings.next > 0) {
      setEnabled(true);
    }
  };

  const createGroup = () => {
    const el = document.createElement("div");
    el.className = "sa-onion-group";
    return el;
  };

  const createButton = ({ useButtonTag } = {}) => {
    const el = document.createElement(useButtonTag ? "button" : "span");
    el.className = "sa-onion-button";
    el.setAttribute("role", "button");
    return el;
  };

  const createButtonImage = (name) => {
    const el = document.createElement("img");
    el.className = "sa-onion-image";
    el.draggable = false;
    el.src = addon.self.dir + "/" + name + ".svg";
    return el;
  };

  const paintEditorControlsContainer = document.createElement("div");
  paintEditorControlsContainer.className = "sa-onion-controls-container";
  paintEditorControlsContainer.dir = "";

  const toggleControlsGroup = createGroup();
  addon.tab.displayNoneWhileDisabled(toggleControlsGroup, { display: "flex" });

  const toggleButton = createButton();
  toggleButton.dataset.enabled = settings.enabled;
  toggleButton.addEventListener("click", () => setEnabled(!settings.enabled));
  toggleButton.title = msg("toggle");
  toggleButton.appendChild(createButtonImage("toggle"));
  toggleControlsGroup.appendChild(toggleButton);

  const settingButton = createButton();
  settingButton.addEventListener("click", () => setSettingsOpen(!areSettingsOpen()));
  settingButton.title = msg("settings");
  settingButton.appendChild(createButtonImage("settings"));
  toggleControlsGroup.appendChild(settingButton);

  paintEditorControlsContainer.appendChild(toggleControlsGroup);

  //
  // Settings page
  //

  const settingsPage = document.createElement("div");
  settingsPage.className = "sa-onion-settings";

  const setSettingsOpen = (open) => {
    settingButton.dataset.enabled = open;
    settingsPage.dataset.visible = open;
  };
  const areSettingsOpen = () => settingsPage.dataset.visible === "true";

  const layerInputs = {};
  for (const type of ["previous", "next", "opacity", "opacityStep"]) {
    const container = document.createElement("label");
    container.className = "sa-onion-settings-line";

    const label = document.createElement("div");
    label.className = "sa-onion-settings-label";
    label.textContent = msg(type);
    container.appendChild(label);

    const group = createGroup();
    const currentButton = createButton();

    const filler = document.createElement("div");
    filler.style.width = "20px";
    currentButton.appendChild(filler);

    const currentInput = document.createElement("input");
    layerInputs[type] = currentInput;
    currentInput.className = "sa-onion-settings-input";
    currentInput.type = "number";
    currentInput.step = "1";
    currentInput.min = "0";
    currentInput.max = "100";
    currentInput.value = settings[type];
    currentInput.addEventListener("input", (e) => {
      if (currentInput.value.length === 0) {
        settings[type] = 0;
        settingsChanged();
        return;
      }
      let value = +currentInput.value;
      if (value > +currentInput.max) {
        value = +currentInput.max;
      } else if (value < 0) {
        value = 0;
      }
      currentInput.value = value;
      settings[type] = value;
      settingsChanged();
    });
    currentInput.addEventListener("blur", () => {
      if (!currentInput.value) {
        currentInput.value = "0";
      }
    });
    currentButton.appendChild(currentInput);

    const decrementButton = createButton();
    decrementButton.appendChild(createButtonImage("decrement"));
    decrementButton.addEventListener("click", () => {
      if (settings[type] > 0) {
        settings[type]--;
        currentInput.value = settings[type];
        settingsChanged();
      }
    });

    const incrementButton = createButton();
    incrementButton.appendChild(createButtonImage("increment"));
    incrementButton.addEventListener("click", () => {
      if (settings[type] < +currentInput.max) {
        settings[type]++;
        currentInput.value = settings[type];
        settingsChanged();
      }
    });

    group.appendChild(decrementButton);
    group.appendChild(currentButton);
    group.appendChild(incrementButton);
    container.appendChild(group);
    settingsPage.appendChild(container);
  }

  const modeContainer = document.createElement("div");
  modeContainer.className = "sa-onion-settings-line";
  const modeLabel = document.createElement("div");
  modeLabel.className = "sa-onion-settings-label";
  modeLabel.textContent = msg("mode");
  const modeGroup = createGroup();
  modeContainer.appendChild(modeLabel);
  const modeMergeButton = createButton({ useButtonTag: true });
  modeMergeButton.appendChild(document.createTextNode(msg("merge")));
  modeGroup.appendChild(modeMergeButton);
  modeMergeButton.addEventListener("click", (e) => {
    settings.mode = "merge";
    modeTintButton.dataset.enabled = false;
    modeMergeButton.dataset.enabled = true;
    settingsChanged();
  });
  modeMergeButton.dataset.enabled = settings.mode === "merge";
  const modeTintButton = createButton({ useButtonTag: true });
  modeTintButton.appendChild(document.createTextNode(msg("tint")));
  modeGroup.appendChild(modeTintButton);
  modeTintButton.addEventListener("click", (e) => {
    settings.mode = "tint";
    modeTintButton.dataset.enabled = true;
    modeMergeButton.dataset.enabled = false;
    settingsChanged();
  });
  modeTintButton.dataset.enabled = settings.mode === "tint";
  modeContainer.appendChild(modeGroup);
  settingsPage.appendChild(modeContainer);

  const layeringContainer = document.createElement("div");
  layeringContainer.className = "sa-onion-settings-line";
  const layeringLabel = document.createElement("div");
  layeringLabel.className = "sa-onion-settings-label";
  layeringLabel.textContent = msg("layering");
  const layeringGroup = createGroup();
  layeringContainer.appendChild(layeringLabel);
  const layeringFrontButton = createButton({ useButtonTag: true });
  layeringFrontButton.appendChild(document.createTextNode(msg("front")));
  layeringGroup.appendChild(layeringFrontButton);
  layeringFrontButton.addEventListener("click", (e) => {
    settings.layering = "front";
    layeringBehindButton.dataset.enabled = false;
    layeringFrontButton.dataset.enabled = true;
    settingsChanged(true);
  });
  layeringFrontButton.dataset.enabled = settings.layering === "front";
  const layeringBehindButton = createButton({ useButtonTag: true });
  layeringBehindButton.appendChild(document.createTextNode(msg("behind")));
  layeringGroup.appendChild(layeringBehindButton);
  layeringBehindButton.addEventListener("click", (e) => {
    settings.layering = "behind";
    layeringBehindButton.dataset.enabled = true;
    layeringFrontButton.dataset.enabled = false;
    settingsChanged(true);
  });
  layeringBehindButton.dataset.enabled = settings.layering === "behind";
  layeringContainer.appendChild(layeringGroup);
  settingsPage.appendChild(layeringContainer);

  const SVG_NS = "http://www.w3.org/2000/svg";
  const settingsTip = document.createElementNS(SVG_NS, "svg");
  settingsTip.setAttribute("class", "sa-onion-settings-tip");
  settingsTip.setAttribute("width", "14");
  settingsTip.setAttribute("height", "7");
  const settingsTipShape = document.createElementNS(SVG_NS, "polygon");
  settingsTipShape.setAttribute("class", "sa-onion-settings-polygon");
  settingsTipShape.setAttribute("points", "0,0 7,7, 14,0");
  settingsTip.appendChild(settingsTipShape);
  settingsPage.appendChild(settingsTip);

  let oldEnabled = null;
  addon.self.addEventListener("disabled", () => {
    setSettingsOpen(false);
    oldEnabled = settings.enabled;
    setEnabled(false);
  });
  addon.self.addEventListener("reenabled", () => {
    setEnabled(oldEnabled);
  });

  const controlsLoop = async () => {
    let hasRunOnce = false;
    while (true) {
      const canvasControls = await addon.tab.waitForElement("[class^='paint-editor_canvas-controls']", {
        markAsSeen: true,
        reduxEvents: ["scratch-gui/navigation/ACTIVATE_TAB", "scratch-gui/mode/SET_PLAYER"],
        reduxCondition: (state) =>
          state.scratchGui.editorTab.activeTabIndex === 1 && !state.scratchGui.mode.isPlayerOnly,
      });
      const zoomControlsContainer = canvasControls.querySelector("[class^='paint-editor_zoom-controls']");
      const canvasContainer = document.querySelector("[class^='paint-editor_canvas-container']");

      // TODO: when leaving the paint editor, references to the old zoom controls are kept around by our DOM
      // Need to investigate whether this leaks memory or other issues.
      const oldZoomControlsContainer = paintEditorControlsContainer.querySelector(
        "[class^='paint-editor_zoom-controls']"
      );
      if (oldZoomControlsContainer) {
        oldZoomControlsContainer.parentNode.removeChild(oldZoomControlsContainer);
      }

      paintEditorControlsContainer.appendChild(zoomControlsContainer);
      canvasControls.appendChild(paintEditorControlsContainer);
      canvasContainer.appendChild(settingsPage);

      if (!hasRunOnce) {
        hasRunOnce = true;
        const groupClass = zoomControlsContainer.firstChild.className;
        const buttonClass = zoomControlsContainer.firstChild.firstChild.className;
        const imageClass = zoomControlsContainer.firstChild.firstChild.firstChild.className;
        for (const el of document.querySelectorAll(".sa-onion-group")) {
          el.className += " " + groupClass;
        }
        for (const el of document.querySelectorAll(".sa-onion-button")) {
          el.className += " " + buttonClass;
        }
        for (const el of document.querySelectorAll(".sa-onion-image")) {
          el.className += " " + imageClass;
        }
      }

      if (settings.enabled) {
        updateOnionLayers();
      }
    }
  };

  injectPaper();
  injectPaperCanvas();
  controlsLoop();
}
