export default async function ({ addon, console }) {
  const paper = await addon.tab.traps.getPaper();
  // Do not cache paper.view.element: the canvas element may be replaced when
  // the paint editor unmounts and remounts across tab navigation.
  // Always read paper.view.element dynamically at call time.

  let spaceHeld = false;
  let panning = false;
  let lastX = 0;
  let lastY = 0;

  const onKeyDown = (e) => {
    if (e.code !== "Space") return;
    // Don't pan when typing in a text field.
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.isContentEditable) return;
    e.preventDefault();
    if (spaceHeld) return;
    spaceHeld = true;
    if (!panning) paper.view.element.style.cursor = "grab";
  };

  const onKeyUp = (e) => {
    if (e.code === "Space") {
      spaceHeld = false;
      if (!panning) paper.view.element.style.cursor = "";
      return;
    }
    // Releasing Alt alone causes browsers on Windows to focus the menu bar.
    // Suppress this while the paint editor canvas is on the page.
    if (e.code === "AltLeft" || e.code === "AltRight") {
      if (paper.view.element?.isConnected) e.preventDefault();
    }
  };

  const onPointerDown = (e) => {
    const isSpaceDrag = spaceHeld && e.button === 0;
    const isMiddleClick = e.button === 1;
    if (!isSpaceDrag && !isMiddleClick) return;
    // Only pan when the pointer is within the paint canvas area.
    // Using getBoundingClientRect rather than target containment so that
    // events on the SVG overlay (which is a sibling of the canvas, not a
    // descendant) are also caught correctly.
    const canvas = paper.view.element;
    const rect = canvas.getBoundingClientRect();
    if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) return;
    // Intercept before paper.js so no tool action starts.
    e.stopPropagation();
    e.preventDefault();
    panning = true;
    lastX = e.clientX;
    lastY = e.clientY;
    canvas.style.cursor = "grabbing";
    canvas.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e) => {
    if (!panning) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    // Convert screen-pixel delta to project units via the view matrix,
    // which correctly accounts for zoom level and device pixel ratio.
    const origin = paper.view.viewToProject(new paper.Point(0, 0));
    const moved = paper.view.viewToProject(new paper.Point(dx, dy));
    paper.view.center = paper.view.center.subtract(moved.subtract(origin));
  };

  const onPointerUp = () => {
    if (!panning) return;
    panning = false;
    paper.view.element.style.cursor = spaceHeld ? "grab" : "";
  };

  const onWheel = (e) => {
    if (!e.altKey) return;
    // Only act when the pointer is over the paint canvas area.
    // Use getBoundingClientRect so this works even when the event target is
    // on the SVG overlay sitting above the canvas.
    const canvas = paper.view.element;
    const rect = canvas.getBoundingClientRect();
    if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) return;
    e.preventDefault();
    e.stopPropagation();

    const ZOOM_FACTOR = 1.15;
    const factor = e.deltaY < 0 ? ZOOM_FACTOR : 1 / ZOOM_FACTOR;
    const oldZoom = paper.view.zoom;
    const newZoom = Math.min(Math.max(oldZoom * factor, 0.25), 32);
    if (newZoom === oldZoom) return;

    // Find the project-space point under the cursor using view.bounds.
    // Normalise cursor position to [0,1] within the canvas's rendered rect,
    // then interpolate into the currently visible project-space bounds.
    // This avoids viewToProject entirely and works regardless of CSS scaling.
    const nx = (e.clientX - rect.left) / rect.width;
    const ny = (e.clientY - rect.top) / rect.height;
    const b = paper.view.bounds;
    const cursorProject = new paper.Point(b.x + nx * b.width, b.y + ny * b.height);

    paper.view.zoom = newZoom;

    // After the zoom change, find where that same project point now sits
    // relative to the (unchanged) center, and correct for the drift.
    const b2 = paper.view.bounds;
    const newCursorProject = new paper.Point(b2.x + nx * b2.width, b2.y + ny * b2.height);
    paper.view.center = paper.view.center.add(cursorProject.subtract(newCursorProject));
  };

  const init = () => {
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp, { capture: true });
    // Use document-level capture so that:
    // (a) events targeting the SVG overlay (sibling of canvas) are caught too, and
    // (b) stale canvas references after paint-editor remounts don't break panning.
    document.addEventListener("pointerdown", onPointerDown, { capture: true });
    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", onPointerUp);
    window.addEventListener("wheel", onWheel, { capture: true, passive: false });
  };

  const cleanup = () => {
    spaceHeld = false;
    panning = false;
    paper.view.element.style.cursor = "";
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp, { capture: true });
    document.removeEventListener("pointerdown", onPointerDown, { capture: true });
    document.removeEventListener("pointermove", onPointerMove);
    document.removeEventListener("pointerup", onPointerUp);
    window.removeEventListener("wheel", onWheel, { capture: true });
  };

  addon.self.addEventListener("disabled", cleanup);
  addon.self.addEventListener("reenabled", init);

  init();
}
