export default async function ({ addon, console }) {
  const paper = await addon.tab.traps.getPaper();
  const canvas = paper.view.element;

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
    if (!panning) canvas.style.cursor = "grab";
  };

  const onKeyUp = (e) => {
    if (e.code !== "Space") return;
    spaceHeld = false;
    if (!panning) canvas.style.cursor = "";
  };

  const onPointerDown = (e) => {
    const isSpaceDrag = spaceHeld && e.button === 0;
    const isMiddleClick = e.button === 1;
    if (!isSpaceDrag && !isMiddleClick) return;
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
    canvas.style.cursor = spaceHeld ? "grab" : "";
  };

  const onWheel = (e) => {
    if (!e.altKey) return;
    // Only act when the pointer is over the paint canvas.
    if (!canvas.contains(e.target) && e.target !== canvas) return;
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
    const rect = canvas.getBoundingClientRect();
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
    window.addEventListener("keyup", onKeyUp);
    canvas.addEventListener("pointerdown", onPointerDown, { capture: true });
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("wheel", onWheel, { capture: true, passive: false });
  };

  const cleanup = () => {
    spaceHeld = false;
    panning = false;
    canvas.style.cursor = "";
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
    canvas.removeEventListener("pointerdown", onPointerDown, { capture: true });
    canvas.removeEventListener("pointermove", onPointerMove);
    canvas.removeEventListener("pointerup", onPointerUp);
    canvas.removeEventListener("wheel", onWheel);
    window.removeEventListener("wheel", onWheel, { capture: true });
  };

  addon.self.addEventListener("disabled", cleanup);
  addon.self.addEventListener("reenabled", init);

  init();
}
