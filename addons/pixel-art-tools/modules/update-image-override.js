const ART_BOARD_WIDTH = 960;
const ART_BOARD_HEIGHT = 720;

export function installUpdateImageOverride(addon, state, paper) {
  const patchedInstances = new WeakSet();
  const wrappedCallbacks = new WeakMap();

  const getRaster = () => paper?.project?.layers?.find((layer) => layer?.data?.isRasterLayer)?.children?.[0] || null;

  const getWrappedCallback = (original) => {
    if (wrappedCallbacks.has(original)) return wrappedCallbacks.get(original);
    const fn = function (isVector, image, centerX, centerY, ...rest) {
      if (addon.self.disabled || isVector || !state.enabled || !addon.settings.get("preventTrim")) {
        return original.call(this, isVector, image, centerX, centerY, ...rest);
      }

      const raster = getRaster();
      const canvasWidth = raster?.canvas?.width || raster?.width || ART_BOARD_WIDTH;
      const canvasHeight = raster?.canvas?.height || raster?.height || ART_BOARD_HEIGHT;
      const targetW = Math.min(state.pendingSize?.width || canvasWidth, canvasWidth);
      const targetH = Math.min(state.pendingSize?.height || canvasHeight, canvasHeight);
      const positionX = raster?.position?.x;
      const positionY = raster?.position?.y;
      if (!raster?.loaded || typeof positionX !== "number" || typeof positionY !== "number" || !targetW || !targetH) {
        return original.call(this, isVector, image, centerX, centerY, ...rest);
      }

      const x = Math.round(positionX - targetW / 2);
      const y = Math.round(positionY - targetH / 2);
      const rect = { x, y, width: targetW, height: targetH };
      const corrected = raster.getImageData(rect);
      const nextCenter = {
        x: Math.round(targetW / 2 + ART_BOARD_WIDTH / 2 - positionX),
        y: Math.round(targetH / 2 + ART_BOARD_HEIGHT / 2 - positionY),
      };
      return original.call(this, false, corrected, nextCenter.x, nextCenter.y, ...rest);
    };
    wrappedCallbacks.set(original, fn);
    return fn;
  };

  const patchUpdateImageInstance = (instance) => {
    if (
      !instance ||
      patchedInstances.has(instance) ||
      typeof instance.handleUpdateBitmap !== "function" ||
      typeof instance.props?.onUpdateImage !== "function"
    ) {
      return;
    }

    const originalHandleUpdateBitmap = instance.handleUpdateBitmap;
    instance.handleUpdateBitmap = function (...args) {
      if (addon.self.disabled || !state.enabled || !addon.settings.get("preventTrim")) {
        return originalHandleUpdateBitmap.apply(this, args);
      }
      const originalOnUpdateImage = this.props.onUpdateImage;
      const wrappedOnUpdateImage = getWrappedCallback(originalOnUpdateImage);
      this.props.onUpdateImage = wrappedOnUpdateImage;
      state.updateImageActive = true;
      try {
        return originalHandleUpdateBitmap.apply(this, args);
      } finally {
        state.updateImageActive = false;
        if (this.props.onUpdateImage === wrappedOnUpdateImage) {
          this.props.onUpdateImage = originalOnUpdateImage;
        }
      }
    };
    patchedInstances.add(instance);
  };

  const patchFiberTree = (root) => {
    const seen = new Set();
    const stack = [root];
    while (stack.length) {
      const node = stack.pop();
      if (!node || seen.has(node)) continue;
      seen.add(node);

      patchUpdateImageInstance(node.stateNode);

      if (node.child) stack.push(node.child);
      if (node.sibling) stack.push(node.sibling);
    }
  };

  const patchFiberLineage = (node) => {
    const seen = new Set();
    while (node && !seen.has(node)) {
      seen.add(node);
      patchUpdateImageInstance(node.stateNode);
      if (node.child) patchFiberTree(node.child);
      node = node.return;
    }
  };

  const install = async () => {
    while (true) {
      const canvasContainer = await addon.tab.waitForElement("[class*='paint-editor_canvas-container_']", {
        markAsSeen: true,
        reduxEvents: [
          "scratch-gui/navigation/ACTIVATE_TAB",
          "scratch-gui/mode/SET_PLAYER",
          "scratch-gui/targets/UPDATE_TARGET_LIST",
          "scratch-paint/formats/CHANGE_FORMAT",
        ],
        reduxCondition: (store) =>
          store.scratchGui.editorTab.activeTabIndex === 1 && !store.scratchGui.mode.isPlayerOnly,
      });
      const internalKey = addon.tab.traps.getInternalKey(canvasContainer);
      const root = internalKey ? canvasContainer[internalKey] : null;
      if (root) patchFiberLineage(root);
    }
  };

  install();
}
