const resizeCallbacks = new Set();
let resizeListenerAttached = false;

const onWindowResize = () => {
  for (const callback of resizeCallbacks) callback();
};

const attachSharedResizeListener = () => {
  if (resizeListenerAttached) return;
  resizeListenerAttached = true;
  window.addEventListener("resize", onWindowResize);
};

const detachSharedResizeListener = () => {
  if (!resizeListenerAttached || resizeCallbacks.size) return;
  resizeListenerAttached = false;
  window.removeEventListener("resize", onWindowResize);
};

export function bindFloatingPanel(addon, panel, header, updateFloat) {
  let dragStart = null;
  let activePointerId = null;
  let resizeRegistered = false;

  const registerResizeCallback = () => {
    if (resizeRegistered) return;
    resizeRegistered = true;
    resizeCallbacks.add(updateFloat);
    attachSharedResizeListener();
  };

  const unregisterResizeCallback = () => {
    if (!resizeRegistered) return;
    resizeRegistered = false;
    resizeCallbacks.delete(updateFloat);
    detachSharedResizeListener();
  };

  const clearDrag = () => {
    if (activePointerId !== null && header.hasPointerCapture?.(activePointerId)) {
      header.releasePointerCapture(activePointerId);
    }
    dragStart = null;
    activePointerId = null;
  };

  const onPointerDown = (event) => {
    if (addon.self.disabled || panel.dataset.floating !== "true") return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    dragStart = {
      x: event.clientX - panel.offsetLeft,
      y: event.clientY - panel.offsetTop,
    };
    activePointerId = event.pointerId;
    header.setPointerCapture?.(event.pointerId);
    event.preventDefault();
  };

  const onPointerMove = (event) => {
    if (!dragStart || event.pointerId !== activePointerId) return;
    Object.assign(panel.style, {
      left: `${event.clientX - dragStart.x}px`,
      top: `${event.clientY - dragStart.y}px`,
      right: "auto",
    });
  };

  const onPointerEnd = (event) => {
    if (event.pointerId !== activePointerId) return;
    clearDrag();
  };

  header.style.touchAction = "none";
  header.addEventListener("pointerdown", onPointerDown);
  header.addEventListener("pointermove", onPointerMove);
  header.addEventListener("pointerup", onPointerEnd);
  header.addEventListener("pointercancel", onPointerEnd);
  header.addEventListener("lostpointercapture", clearDrag);

  registerResizeCallback();

  addon.self.addEventListener("disabled", () => {
    clearDrag();
    unregisterResizeCallback();
  });
  addon.self.addEventListener("reenabled", () => {
    registerResizeCallback();
    updateFloat();
  });
}
