import { applyHotfixes } from "./hotfixes.js";
import { createPaintToolbarController } from "./toolbar-controller.js";
import {
  applyStyle,
  cleanResult,
  cloneStyle,
  convertTextItems,
  getLeafPaths,
  getPaintingSelected,
  getTopLevelSelected,
  intersectRegionsFrom,
  itemToRegion,
  offsetItem,
  preprocessPaths,
  subtractCuttersFrom,
} from "./paper-helpers.js";

export default async function ({ addon, msg }) {
  // Watch Redux so the button follows the Costume editor's active paint tool.
  addon.tab.redux.initialize();
  // Wait until Scratch's generated More-menu disabled class is available.
  await addon.tab.scratchClassReady();

  // Mangled disabled-state class, populated after first DOM injection.
  let modDisabledClass = "";
  // Dashed-border separator class, populated after first DOM injection.
  let dashedBorderClass = "";

  // ── "Shaping" section: inline on wide toolbar, collapsed dropdown on narrow ──
  const shapingSection = document.createElement("div");
  shapingSection.className = "sa-shaping-section";
  shapingSection.setAttribute("dir", "");
  addon.tab.displayNoneWhileDisabled(shapingSection);

  // Builds one inline toolbar button (icon + label) for a shaping operation.
  const makeItem = (iconFile, label, title, op) => {
    const btn = document.createElement("span");
    btn.className = "sa-shaping-item";
    btn.setAttribute("role", "button");
    btn.title = title;
    btn.dataset.saOp = op;
    const img = document.createElement("img");
    img.className = "sa-shaping-item-icon";
    img.draggable = false;
    img.src = `${addon.self.dir}/icons/${iconFile}`;
    const lbl = document.createElement("span");
    lbl.className = "sa-shaping-item-label";
    lbl.textContent = label;
    btn.appendChild(img);
    btn.appendChild(lbl);
    return btn;
  };

  const uniteBtn = makeItem("unite.svg", msg("unite"), msg("unite-desc"), "unite");
  const subtractBtn = makeItem("subtract.svg", msg("subtract"), msg("subtract-alt"), "subtract");
  const intersectBtn = makeItem("intersect.svg", msg("intersect"), msg("intersect-alt"), "intersect");
  const compoundBtn = makeItem("combine.svg", msg("combine"), msg("combine-desc"), "combine");
  const expandBtn = makeItem("expand.svg", msg("expand"), msg("expand-desc"), "expand");

  // Each group gets native input-group classes (flex layout, inter-group spacing) once
  // known. A dashed-border separator goes on a group div, never on a button directly -
  // that class assumes a group-div's box model and strips borders/padding meant for
  // separators when applied to a button (e.g. under the compact-editor addon).
  const makeGroup = (...items) => {
    const group = document.createElement("div");
    group.append(...items);
    return group;
  };
  const booleanOpsGroup = makeGroup(uniteBtn, subtractBtn, intersectBtn);
  const compoundGroup = makeGroup(compoundBtn);
  const expandGroup = makeGroup(expandBtn);
  shapingSection.append(booleanOpsGroup, compoundGroup, expandGroup);

  // ── Click handler ─────────────────────────────────────────────────────
  // Routes clicks on any [data-sa-op] element to the correct operation.
  const handleClick = (e) => {
    if (addon.self.disabled) return;
    const btn = e.target.closest("[data-sa-op]");
    if (!btn) return;
    const op = btn.dataset.saOp;
    // Inline and More buttons use different disabled classes, but both contain this marker.
    if ([...btn.classList].some((className) => className.includes("mod-disabled"))) return;
    if (op === "combine") performCombine();
    else if (op === "release") performRelease();
    else if (op === "expand") performOffset();
    else if (op === "intersect" && e.altKey) performDivide();
    else if (op === "subtract" && e.shiftKey) performBooleanOp("subtract", e.altKey);
    else if (op === "subtract") performPunchThrough(e.altKey);
    else performBooleanOp(op, e.altKey);
  };
  shapingSection.addEventListener("click", handleClick);

  // ── More-popover item factory ──────────────────────────────────────────
  // Builds a button matching the native More popover item structure.
  // Disabled More items need both the menu class and the shared button class
  // for correct behavior and opacity. Resolve the menu class directly because
  // the menu may contain no disabled native item to copy.
  const moreMenuDisabledClass = addon.tab.scratchClass("fixed-tools_mod-disabled");

  const makeMoreItem = (iconFile, label, op) => {
    const btn = document.createElement("span");
    btn.dataset.saOp = op;
    addon.tab.displayNoneWhileDisabled(btn);
    const img = document.createElement("img");
    img.draggable = false;
    img.src = `${addon.self.dir}/icons/${iconFile}`;
    const lbl = document.createElement("span");
    lbl.textContent = label;
    btn.appendChild(img);
    btn.appendChild(lbl);
    btn.addEventListener("click", handleClick);
    return btn;
  };

  const moreUniteBtn = makeMoreItem("unite.svg", msg("unite"), "unite");
  const moreSubtractBtn = makeMoreItem("subtract.svg", msg("subtract"), "subtract");
  const moreIntersectBtn = makeMoreItem("intersect.svg", msg("intersect"), "intersect");
  const moreCompoundBtn = makeMoreItem("combine.svg", msg("combine"), "combine");
  const moreExpandBtn = makeMoreItem("expand.svg", msg("expand"), "expand");
  const allMoreItems = [moreUniteBtn, moreSubtractBtn, moreIntersectBtn, moreCompoundBtn, moreExpandBtn];

  // ── Enable/disable buttons based on current paper.js selection ─────────
  // Runs fn after React's next two paint frames. This is necessary because
  // triggerUpdateImage() round-trips through Redux, resetting paper.js
  // selectedItems — callers must read selection only after that settles.
  const afterReduxRoundTrip = (fn) => requestAnimationFrame(() => requestAnimationFrame(fn));

  // Schedules updateButtonStates once the round-trip above has settled.
  const deferUpdateButtonStates = () => afterReduxRoundTrip(updateButtonStates);

  // Include paths inside Groups and CompoundPaths, not only top-level shapes.
  const getOpenClosePaths = (paper) =>
    paper.project.selectedItems.filter((item) => item.layer?.data?.isPaintingLayer && item instanceof paper.Path);

  // Reads the current paper.js selection and enables or disables each button
  // accordingly. Also morphs the Combine/Release and Open/Close buttons.
  const updateButtonStates = async () => {
    if (!modDisabledClass) {
      const anyDisabled = document.querySelector("[class*='button_mod-disabled_']");
      if (anyDisabled) {
        modDisabledClass = [...anyDisabled.classList].find((c) => c.includes("mod-disabled")) ?? "";
        for (const btn of shapingSection.querySelectorAll("[data-sa-op]")) {
          btn.classList.add(modDisabledClass);
        }
      }
    }
    const paper = await addon.tab.traps.getPaper();
    const sel = paper.project.selectedItems.filter(
      (item) =>
        (item instanceof paper.Path || item instanceof paper.CompoundPath || item instanceof paper.Group) &&
        item.parent instanceof paper.Layer
    );
    const textCount = paper.project.selectedItems.filter(
      (item) => item instanceof paper.PointText && item.parent instanceof paper.Layer
    ).length;
    const openClosePaths = getOpenClosePaths(paper);
    const hasMultiple = sel.length >= 2;
    const hasCompound = sel.some((item) => item instanceof paper.CompoundPath);
    const totalCount = sel.length + textCount;
    // Count only leaves that unite would actually operate on: CompoundPaths and closed Paths.
    // Open paths are left behind by unite, so they don't count toward the threshold.
    const effectiveLeafCount = sel
      .flatMap((item) => getLeafPaths(item, paper))
      .filter((l) => l instanceof paper.CompoundPath || (l instanceof paper.Path && l.closed)).length;
    const isOperationEnabled = (op) => {
      if (op === "unite") return textCount >= 1 || effectiveLeafCount >= 2;
      if (op === "expand") return totalCount >= 1;
      if (op === "combine" || op === "release") return totalCount >= 2 || hasCompound;
      return totalCount >= 2; // subtract, intersect
    };
    if (modDisabledClass) {
      for (const btn of shapingSection.querySelectorAll("[data-sa-op]")) {
        btn.classList.toggle(modDisabledClass, !isOperationEnabled(btn.dataset.saOp));
      }
    }
    const moreDisabledClasses = [moreMenuDisabledClass, modDisabledClass].filter(Boolean);
    if (moreDisabledClasses.length) {
      for (const btn of allMoreItems) {
        for (const disabledClass of moreDisabledClasses) {
          btn.classList.toggle(disabledClass, !isOperationEnabled(btn.dataset.saOp));
        }
      }
    }
    // Compound button morphs: combine ↔ release based on selection.
    const compoundOp = hasMultiple ? "combine" : hasCompound ? "release" : "combine";
    compoundBtn.dataset.saOp = compoundOp;
    compoundBtn.title = msg(`${compoundOp}-desc`);
    compoundBtn.querySelector(".sa-shaping-item-icon").src = `${addon.self.dir}/icons/${compoundOp}.svg`;
    compoundBtn.querySelector(".sa-shaping-item-label").textContent = msg(compoundOp);
    moreCompoundBtn.dataset.saOp = compoundOp;
    moreCompoundBtn.querySelector("img").src = `${addon.self.dir}/icons/${compoundOp}.svg`;
    moreCompoundBtn.querySelector("span").textContent = msg(compoundOp);
    // Open/Close button morphs: "Open Shape" when selection is closed, "Close Shape" when open.
    const allOpen = openClosePaths.length > 0 && openClosePaths.every((path) => !path.closed);
    const openCloseLabel = allOpen ? msg("close-shape") : msg("open-shape");
    const openCloseDesc = allOpen ? msg("close-shape-desc") : msg("open-shape-desc");
    // Update the mode-tools context bar button if it exists.
    if (modeToolsOCLbl) modeToolsOCLbl.textContent = openCloseLabel;
    if (modeToolsOCBtn) {
      modeToolsOCBtn.title = openCloseDesc;
      if (modDisabledClass) modeToolsOCBtn.classList.toggle(modDisabledClass, openClosePaths.length === 0);
    }
    if (modDisabledClass) compoundBtn.classList.toggle(modDisabledClass, !(totalCount >= 2 || hasCompound));
  };

  // Runs a flat unite, subtract, or intersect on the current paper.js selection.
  // keepTop=true clones the front shape and keeps it in place after the op.
  const performBooleanOp = async (opName, keepTop = false) => {
    const paper = await addon.tab.traps.getPaper();

    if (opName === "subtract" || opName === "intersect") {
      // Auto-expand any selected text items to paths before operating.
      convertTextItems(paper);
      // Group-aware subtract/intersect: the backmost top-level item is the
      // target; everything above it defines the operating region.
      const topLevel = getTopLevelSelected(paper);
      if (topLevel.length < 2) return;
      const bottom = topLevel[0];
      const uppers = topLevel.slice(1);
      const bottomLeaves = getLeafPaths(bottom, paper);
      const upperLeaves = uppers.flatMap((u) => getLeafPaths(u, paper));
      preprocessPaths([...bottomLeaves, ...upperLeaves], paper);

      // If keepTop, clone ALL uppers before they get removed — they'll be
      // kept in place and selected after the operation.
      const upperCopies =
        keepTop && opName === "subtract"
          ? uppers.map((u) => {
              const c = u.clone();
              c.selected = false;
              return c;
            })
          : null;
      // For intersect keepTop, only retain the topmost upper (the clip shape).
      const topItem = uppers[uppers.length - 1];
      const topCopy = keepTop && opName === "intersect" ? topItem.clone() : null;
      if (topCopy) topCopy.selected = false;

      let rebuilt;
      if (opName === "subtract") {
        rebuilt = subtractCuttersFrom(bottom, upperLeaves, paper);
      } else {
        // Each upper top-level item is unioned into one region before clipping,
        // so a group acts as a single indivisible cookie-cutter.
        const clipRegions = uppers.map((u) => itemToRegion(u, paper));
        rebuilt = intersectRegionsFrom(bottom, clipRegions, paper);
        for (const r of clipRegions) r.remove();
      }

      const bottomIdx = bottom.index;
      const layer = bottom.layer;
      bottom.selected = false;
      bottom.remove();
      for (const upper of uppers) {
        upper.selected = false;
        upper.remove();
      }
      if (rebuilt) {
        layer.insertChild(bottomIdx, rebuilt);
        // Only select the rebuilt bottom when not keeping uppers.
        if (!upperCopies) rebuilt.selected = true;
      }
      // Subtract+Alt: restore all upper copies, select them only.
      // No bringToFront() needed — each clone was inserted right after its
      // original by clone(), so removing the original leaves the clone at the
      // correct z-index automatically.
      if (upperCopies) {
        for (const c of upperCopies) c.selected = true;
      }
      // Intersect+Alt: restore just the topmost clip shape and select it.
      if (topCopy) topCopy.selected = true;
      triggerUpdateImage();
      deferUpdateButtonStates();
      return;
    }

    // unite: optionally convert any selected text items to path outlines first.
    let convertedText = 0;
    if (opName === "unite") convertedText = convertTextItems(paper);
    // flat selection, chain back→front into one result.
    const selected = getPaintingSelected(paper);
    if (selected.length < 2) {
      // Single converted text item: no unite needed, just save.
      if (convertedText > 0 && selected.length === 1) {
        triggerUpdateImage();
        deferUpdateButtonStates();
      }
      return;
    }
    preprocessPaths(selected, paper);

    // When keepTop is set, clone the frontmost shape before anything is removed.
    const topClone = keepTop ? selected[selected.length - 1].clone() : null;
    if (topClone) topClone.selected = false;

    const bottomStyle = cloneStyle(selected[0]);
    let result = selected[0];
    const toRemove = [];
    for (let i = 1; i < selected.length; i++) {
      const prev = result;
      result = prev[opName](selected[i]);
      toRemove.push(prev, selected[i]);
    }
    for (const item of toRemove) {
      if (item !== result) item.remove();
    }
    const cleaned = cleanResult(result);
    if (cleaned) {
      applyStyle(cleaned, bottomStyle);
      cleaned.selected = true;
    }
    // No bringToFront() — clone lands at the correct z-index once its original is removed.
    triggerUpdateImage();
    deferUpdateButtonStates();
  };

  // ── Punch Through (Shift+Subtract) ──────────────────────────────────────
  // The topmost selected item cuts through every other selected item.
  // Targets are processed front→back so index insertions don't shift unprocessed items.
  const performPunchThrough = async (keepTop = false) => {
    const paper = await addon.tab.traps.getPaper();
    convertTextItems(paper);
    const topLevel = getTopLevelSelected(paper);
    if (topLevel.length < 2) return;

    const topItem = topLevel[topLevel.length - 1];
    const targets = topLevel.slice(0, -1);
    const cutterLeaves = getLeafPaths(topItem, paper);
    preprocessPaths([...targets.flatMap((t) => getLeafPaths(t, paper)), ...cutterLeaves], paper);

    // Process front→back so high-index insertions don't disturb lower targets.
    const allResults = [];
    for (const target of [...targets].reverse()) {
      const targetLayerIdx = target.index;
      const layer = target.layer;
      // subtractCuttersFrom preserves arbitrary nesting depth.
      const rebuilt = subtractCuttersFrom(target, cutterLeaves, paper);
      target.selected = false;
      target.remove();
      if (rebuilt) {
        layer.insertChild(targetLayerIdx, rebuilt);
        allResults.push(rebuilt);
      }
    }

    const topCopy = keepTop ? topItem.clone() : null;
    if (topCopy) topCopy.selected = false;

    topItem.selected = false;
    topItem.remove();
    for (const r of allResults) r.selected = true;
    // Restore the cutter and select it too. No bringToFront() needed — the
    // clone was inserted after topItem by clone(), so topItem.remove() leaves
    // it at the correct z-index.
    if (topCopy) topCopy.selected = true;
    triggerUpdateImage();
    deferUpdateButtonStates();
  };

  // ── Divide (Alt+Intersect) ────────────────────────────────────────────────
  // Splits all selected shapes into every distinct non-overlapping region,
  // like Illustrator's Divide Pathfinder. Each overlap fragment takes the
  // colour of the frontmost shape covering it.
  const performDivide = async () => {
    const paper = await addon.tab.traps.getPaper();
    convertTextItems(paper);
    const selected = getPaintingSelected(paper);
    if (selected.length < 2) return;
    preprocessPaths(selected, paper);

    // Seed with backmost shape.
    let regions = [selected[0].clone()];
    let styles = [cloneStyle(selected[0])];

    for (let i = 1; i < selected.length; i++) {
      const shape = selected[i];
      const shapeStyle = cloneStyle(shape);
      const nextRegions = [];
      const nextStyles = [];

      // exclusive = part of shape not yet covered by any existing region.
      let exclusive = shape.clone();

      for (let j = 0; j < regions.length; j++) {
        const region = regions[j];
        const regionStyle = styles[j];

        const overlap = region.intersect(shape);
        const remainder = region.subtract(shape);

        // Trim exclusive by this region.
        const prevExclusive = exclusive;
        exclusive = exclusive.subtract(region);
        prevExclusive.remove();

        region.remove(); // split into overlap + remainder — original no longer needed.

        const cleanOverlap = cleanResult(overlap);
        if (cleanOverlap) {
          nextRegions.push(cleanOverlap);
          nextStyles.push(shapeStyle);
        } // front colour wins

        const cleanRemainder = cleanResult(remainder);
        if (cleanRemainder) {
          nextRegions.push(cleanRemainder);
          nextStyles.push(regionStyle);
        }
      }

      // The part of the incoming shape not covered by any prior region.
      const cleanExclusive = cleanResult(exclusive);
      if (cleanExclusive) {
        nextRegions.push(cleanExclusive);
        nextStyles.push(shapeStyle);
      }

      regions = nextRegions;
      styles = nextStyles;
    }

    // Remove originals.
    for (const item of selected) {
      item.selected = false;
      item.remove();
    }

    // Apply styles and select all result fragments.
    for (let k = 0; k < regions.length; k++) {
      applyStyle(regions[k], styles[k]);
      regions[k].selected = true;
    }

    triggerUpdateImage();
    deferUpdateButtonStates();
  };

  // ── Combine ───────────────────────────────────────────────────────────────
  // Merges all selected paths into one CompoundPath using the even-odd fill
  // rule, so overlapping areas become transparent holes.
  const performCombine = async () => {
    const paper = await addon.tab.traps.getPaper();
    convertTextItems(paper);
    const selectedRoots = getTopLevelSelected(paper);
    const selected = selectedRoots
      .flatMap((item) => getLeafPaths(item, paper))
      .filter((item) => item instanceof paper.Path || item instanceof paper.CompoundPath);
    if (selected.length < 2) return;

    // Style from the backmost (bottom) shape.
    const bottomStyle = cloneStyle(selected[0]);

    // Collect all leaf Path nodes, flattening Groups and CompoundPaths.
    const leafPaths = [];
    for (const item of selected) {
      // A selected Group also selects its descendants. Bake each descendant's
      // full ancestor transform before moving it into the top-level CompoundPath.
      const matrix = item.globalMatrix.clone();
      const clone = item.clone();
      clone.remove();
      clone.matrix = matrix;
      clone.applyMatrix = true;
      if (item instanceof paper.CompoundPath) {
        leafPaths.push(...clone.removeChildren());
        clone.remove();
      } else {
        leafPaths.push(clone);
      }
    }

    for (const item of selectedRoots) {
      item.selected = false; // must deselect BEFORE remove so paper clears it from selectedItems
      item.remove();
    }

    const cp = new paper.CompoundPath({ children: leafPaths });
    cp.fillRule = "evenodd";
    applyStyle(cp, bottomStyle);
    cp.selected = true;

    triggerUpdateImage();
    deferUpdateButtonStates();
  };

  // ── Release ───────────────────────────────────────────────────────────────
  // Splits any selected CompoundPaths back into their individual child paths.
  const performRelease = async () => {
    const paper = await addon.tab.traps.getPaper();
    const selected = paper.project.selectedItems.filter((item) => item instanceof paper.CompoundPath);
    if (selected.length < 1) return;

    for (const cp of selected) {
      const parentLayer = cp.layer;
      const idx = cp.index;
      const style = cloneStyle(cp);
      const children = cp.removeChildren();
      cp.remove();
      for (let i = 0; i < children.length; i++) {
        parentLayer.insertChild(idx + i, children[i]);
        applyStyle(children[i], style);
        children[i].selected = true;
      }
    }
    triggerUpdateImage();
    deferUpdateButtonStates();
  };

  // ── Outline Expand ────────────────────────────────────────────────────────
  // Outsets each selected shape by half its stroke width, turning the visual
  // stroke into a filled outline. Text items are converted to paths first.
  const performOffset = async () => {
    const paper = await addon.tab.traps.getPaper();
    convertTextItems(paper);

    const selected = paper.project.selectedItems.filter(
      (item) =>
        item.layer?.data?.isPaintingLayer &&
        (item instanceof paper.Path || item instanceof paper.CompoundPath || item instanceof paper.Group) &&
        item.parent instanceof paper.Layer
    );
    if (!selected.length) return;

    for (const item of selected) {
      // Expand by half the stroke width — approximates converting the visual
      // stroke into a filled outline. Fall back to 1px if there is no stroke.
      // Use the item's own strokeWidth for plain paths/compounds; for Groups,
      // offsetItem descends to each leaf which carries its own strokeWidth.
      const amount = (item.strokeWidth ?? 0) / 2 || 1;
      const result = offsetItem(item, amount, paper);
      if (!result) continue;
      const idx = item.index;
      const layer = item.layer;
      item.selected = false;
      item.remove();
      layer.insertChild(idx, result);
      result.selected = true;
    }

    triggerUpdateImage();
    deferUpdateButtonStates();
  };

  // ── Open / Close ──────────────────────────────────────────────────────────
  // Toggles selected paths between open and closed.
  // CLOSING: sets closed = true (straight line back to start).
  // OPENING: finds the break-point (first segment with segment.selected or
  //   segment.point.selected — only visible when using the Reshape tool),
  //   falls back to segment 0. Rotates so the break-point is first, then
  //   DUPLICATES it as the last segment so both endpoints overlap at the
  //   same position. The first endpoint is selected so the user can
  //   immediately drag it away; the last stays put.
  const performOpenClose = async () => {
    const paper = await addon.tab.traps.getPaper();

    const paths = getOpenClosePaths(paper);

    if (!paths.length) return;

    for (const path of paths) {
      if (path.closed) {
        const n = path.segments.length;

        // Find break-point: prefer individually selected segment anchor,
        // then selected segment (handle or full), then fall back to 0.
        let k = path.segments.findIndex((s) => s.point?.selected);
        if (k < 0) k = path.segments.findIndex((s) => s.selected);
        if (k < 0) k = 0;

        // Snapshot in rotated order so k is first.
        const segData = [];
        for (let i = 0; i < n; i++) {
          const s = path.segments[(k + i) % n];
          segData.push({
            point: s.point.clone(),
            handleIn: s.handleIn.clone(),
            handleOut: s.handleOut.clone(),
          });
        }

        // Rebuild path with n+1 segments: rotate, then duplicate the break-point
        // as the final segment so both endpoints sit at the same position.
        path.removeSegments();
        for (const d of segData) {
          path.add(new paper.Segment(d.point, d.handleIn, d.handleOut));
        }
        // Add duplicate of the first point as the final endpoint.
        // Give it the same handleIn as the break-point segment so the curve
        // arriving from seg[n-1] → seg[n] looks identical to the original
        // closing curve that arrived into the break-point.
        path.add(
          new paper.Segment(
            segData[0].point.clone(),
            segData[0].handleIn.clone(), // preserve incoming curve tangent
            new paper.Point(0, 0) // handleOut has no effect on the last segment
          )
        );

        // The first endpoint's handleIn has no visual effect (nothing comes before
        // it on an open path), so zero it for cleanliness.
        path.firstSegment.handleIn = new paper.Point(0, 0);

        path.closed = false;

        // Select the first endpoint so the user can immediately drag it away;
        // selecting the full segment (not just the point) keeps its handles visible.
        path.firstSegment.selected = true;
      } else {
        // Closing: if the two endpoints are close enough, merge them by
        // removing the last segment (so the path closes back to the existing
        // first segment, preserving its handles).  Otherwise close with a
        // straight line.  5 paper-unit threshold ≈ one or two screen pixels
        // at normal zoom — comfortable snap without snapping when the user
        // has intentionally dragged the endpoint away.
        const MERGE_THRESHOLD = 5;
        const dist = path.firstSegment.point.getDistance(path.lastSegment.point);
        if (dist < MERGE_THRESHOLD) {
          // Preserve the curve handles of both merged endpoints.
          // lastSegment.handleIn = the curve arriving at the last point (was
          // saved from the original breakpoint when we opened the path).
          // After removal, firstSegment.handleIn controls the same join —
          // restore it so the closed path looks smooth at that point.
          const savedHandleIn = path.lastSegment.handleIn.clone();
          path.removeSegment(path.segments.length - 1);
          path.firstSegment.handleIn = savedHandleIn;
        }
        path.closed = true;
      }
    }

    triggerUpdateImage();
    deferUpdateButtonStates();
  };

  // ── Trigger scratch-paint undo snapshot ───────────────────────────────────
  // Walks up the React fiber tree to call handleUpdateImage(), which commits
  // the current paper.js canvas state to Redux and records an undo entry.
  // Also refreshes the bounding-box handles, since a boolean op can resize them.
  const triggerUpdateImage = () => {
    const canvasContainer = document.querySelector("[class*='paint-editor_canvas-container_']");
    if (!canvasContainer) return;
    let fiber = canvasContainer[addon.tab.traps.getInternalKey(canvasContainer)];
    while (fiber && typeof fiber.stateNode?.handleUpdateImage !== "function") {
      fiber = fiber.return;
    }
    if (typeof fiber?.stateNode?.handleUpdateImage === "function") {
      fiber.stateNode.handleUpdateImage();
    }
    // Same refresh mechanism scratch-paint uses after zooming.
    afterReduxRoundTrip(() => addon.tab.redux.dispatch({ type: "scratch-paint/select/REDRAW_SELECTION_BOX" }));
  };

  // ── Open/Close button in the mode-tools context bar ───────────────────
  // Scratch's mode-tools bar beside Fill/Outline/Stroke changes with the
  // active paint tool. Open/Close belongs in Reshape's Curved/Pointed group.

  let modeToolsOCBtn = null; // <span role=button>
  let modeToolsOCIcon = null; // <img>
  let modeToolsOCLbl = null; // <span> label
  let modeToolsClassesApplied = false;

  // Creates the Open/Close button DOM element. Called once; the element is
  // re-inserted into whichever mode-tools bar instance is currently live.
  const buildModeToolsBtn = () => {
    modeToolsOCBtn = document.createElement("span");
    modeToolsOCBtn.setAttribute("role", "button");
    addon.tab.displayNoneWhileDisabled(modeToolsOCBtn);
    modeToolsOCIcon = document.createElement("img");
    modeToolsOCIcon.draggable = false;
    modeToolsOCIcon.src = `${addon.self.dir}/icons/open-close.svg`;
    modeToolsOCLbl = document.createElement("span");
    modeToolsOCLbl.textContent = msg("open-shape");
    modeToolsOCBtn.appendChild(modeToolsOCIcon);
    modeToolsOCBtn.appendChild(modeToolsOCLbl);
    modeToolsOCBtn.addEventListener("click", () => {
      if (addon.self.disabled) return;
      if (modDisabledClass && modeToolsOCBtn.classList.contains(modDisabledClass)) return;
      performOpenClose();
    });
  };
  buildModeToolsBtn();

  // ── Mode-tools injection ──────────────────────────────────────────────────
  // Reshape's mode-tools bar is separate from the fixed toolbar/More menu.
  // Watching the fixed toolbar caused Open/Close to appear only after More opened.
  const modeToolsGroupSelector = "[class*='mode-tools_mode-tools_'] [class*='mode-tools_mod-dashed-border_']";
  const isReshapeState = (state) =>
    state?.scratchGui?.editorTab?.activeTabIndex === 1 &&
    !state.scratchGui?.mode?.isPlayerOnly &&
    state.scratchPaint?.mode === "RESHAPE";
  const isReshapeActive = () => !addon.self.disabled && isReshapeState(addon.tab.redux.state);

  const removeModeToolsBtn = () => {
    modeToolsOCBtn.remove();
  };

  const injectModeToolsBtn = (dashedGroup) => {
    if (!isReshapeActive() || !dashedGroup) {
      removeModeToolsBtn();
      return;
    }

    // Already live in the right place.
    if (dashedGroup.contains(modeToolsOCBtn)) return;

    // Lazily copy button/icon/label classes from the last native button in
    // the dashed group (= "Pointed") on first injection.
    if (!modeToolsClassesApplied) {
      modeToolsClassesApplied = true;
      const btns = dashedGroup.querySelectorAll("[role='button']");
      const refBtn = btns[btns.length - 1]; // "Pointed"
      if (refBtn) {
        modeToolsOCBtn.className = refBtn.className;
        const refIcon = refBtn.querySelector("img");
        const refLbl = refBtn.querySelector("span");
        if (refIcon) modeToolsOCIcon.className = refIcon.className;
        if (refLbl) modeToolsOCLbl.className = refLbl.className;
        if (modDisabledClass) modeToolsOCBtn.classList.add(modDisabledClass);
      }
    }

    // Append after "Pointed" inside the dashed-border group.
    dashedGroup.appendChild(modeToolsOCBtn);
    deferUpdateButtonStates();
  };

  // React can replace the Curved/Pointed group after tool or layout changes.
  // Watch each new group so Open/Close is added without waiting for More.
  const watchModeTools = async () => {
    while (true) {
      const dashedGroup = await addon.tab.waitForElement(modeToolsGroupSelector, {
        markAsSeen: true,
        condition: isReshapeActive,
        reduxCondition: isReshapeState,
      });
      injectModeToolsBtn(dashedGroup);
    }
  };
  watchModeTools();

  // React can also reuse the same group, so recheck it after React updates.
  const syncModeToolsBtn = () =>
    afterReduxRoundTrip(() => injectModeToolsBtn(document.querySelector(modeToolsGroupSelector)));

  addon.tab.redux.addEventListener("statechanged", ({ detail }) => {
    if (isReshapeState(detail.prev) === isReshapeState(detail.next)) return;
    // Remove now so React cannot carry the button into Select or Text, then
    // recheck after React finishes updating the mode-tools bar.
    if (!isReshapeState(detail.next)) removeModeToolsBtn();
    syncModeToolsBtn();
  });

  addon.self.addEventListener("disabled", () => {
    removeModeToolsBtn();
  });
  addon.self.addEventListener("reenabled", () => {
    syncModeToolsBtn();
  });
  syncModeToolsBtn();

  const toolbarController = createPaintToolbarController({
    addon,
    inlineSection: shapingSection,
    inlineSectionClass: "sa-shaping-section",
    inlineItemSelector: ".sa-shaping-item",
    inlineIconSelector: ".sa-shaping-item-icon",
    inlineLabelSelector: ".sa-shaping-item-label",
    overflowItems: allMoreItems,
    onNativeClasses: ({ dashedBorderClass: nativeDashedBorderClass, disabledClass, inputGroupClasses }) => {
      dashedBorderClass = nativeDashedBorderClass;
      if (inputGroupClasses.length) {
        booleanOpsGroup.classList.add(...inputGroupClasses);
        compoundGroup.classList.add(...inputGroupClasses);
        expandGroup.classList.add(...inputGroupClasses);
      }
      // Separates the boolean-set ops group and the compound group from the one after it.
      if (dashedBorderClass) {
        booleanOpsGroup.classList.add(dashedBorderClass);
        compoundGroup.classList.add(dashedBorderClass);
      }
      if (disabledClass) modDisabledClass = disabledClass;
    },
    onOverflowItemsMounted: () => {
      deferUpdateButtonStates();
    },
    onReady: () => {
      // Cache the editor container. Re-query only when React replaces it.
      let editorContainer = null;
      const getEditorContainer = () => {
        if (!editorContainer?.isConnected)
          editorContainer = document.querySelector("[class*='paint-editor_editor-container_']");
        return editorContainer;
      };
      document.addEventListener("mouseup", (e) => {
        if (!addon.self.disabled && getEditorContainer()?.contains(e.target)) deferUpdateButtonStates();
      });
      document.addEventListener("keyup", (e) => {
        if (!addon.self.disabled && getEditorContainer()?.contains(e.target)) deferUpdateButtonStates();
      });
      updateButtonStates();
    },
  });

  // ── Apply paper.js hotfixes ───────────────────────────────────────────
  const paper = await addon.tab.traps.getPaper();
  applyHotfixes(addon, paper);

  toolbarController.start();
}
