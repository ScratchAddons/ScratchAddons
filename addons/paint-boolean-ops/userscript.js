import { applyHotfixes } from "./hotfixes.js";
import { patchToolbarBreakpoint } from "./breakpoint-patch.js";
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
  // Redux must be initialized before waitForElement can use reduxCondition.
  addon.tab.redux.initialize();

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
  shapingSection.append(uniteBtn, subtractBtn, intersectBtn, compoundBtn, expandBtn);

  // ── Click handler ─────────────────────────────────────────────────────
  // Routes clicks on any [data-sa-op] element to the correct operation.
  const handleClick = (e) => {
    if (addon.self.disabled) return;
    const btn = e.target.closest("[data-sa-op]");
    if (!btn) return;
    const op = btn.dataset.saOp;
    if (modDisabledClass && btn.classList.contains(modDisabledClass)) return;
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
  // CSS classes are lazily copied from native items when the popover first opens.
  let moreItemBtnClass = "";
  let moreItemIconClass = "";
  let moreItemDisabledClasses = [];

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
  // Schedules updateButtonStates after React's next two paint frames. This is
  // necessary because triggerUpdateImage() round-trips through Redux, resetting
  // paper.js selectedItems — we must read selection only after that settles.
  const deferUpdateButtonStates = () => requestAnimationFrame(() => requestAnimationFrame(updateButtonStates));

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
    const hasMultiple = sel.length >= 2;
    const hasCompound = sel.some((item) => item instanceof paper.CompoundPath);
    const hasPaths = sel.some((item) => item instanceof paper.Path);
    const totalCount = sel.length + textCount;
    // Count only leaves that unite would actually operate on: CompoundPaths and closed Paths.
    // Open paths are left behind by unite, so they don't count toward the threshold.
    const effectiveLeafCount = sel
      .flatMap((item) => getLeafPaths(item, paper))
      .filter((l) => l instanceof paper.CompoundPath || (l instanceof paper.Path && l.closed)).length;
    if (modDisabledClass) {
      for (const btn of shapingSection.querySelectorAll("[data-sa-op]")) {
        const op = btn.dataset.saOp;
        let enabled;
        if (op === "unite") enabled = textCount >= 1 || effectiveLeafCount >= 2;
        else if (op === "expand") enabled = totalCount >= 1;
        else if (op === "combine" || op === "release") enabled = totalCount >= 2 || hasCompound;
        else enabled = totalCount >= 2; // subtract, intersect
        btn.classList.toggle(modDisabledClass, !enabled);
      }
      if (moreItemDisabledClasses.length) {
        for (const btn of allMoreItems) {
          const op = btn.dataset.saOp;
          let enabled;
          if (op === "unite") enabled = textCount >= 1 || effectiveLeafCount >= 2;
          else if (op === "expand") enabled = totalCount >= 1;
          else if (op === "combine" || op === "release") enabled = totalCount >= 2 || hasCompound;
          else enabled = totalCount >= 2; // subtract, intersect
          for (const cls of moreItemDisabledClasses) btn.classList.toggle(cls, !enabled);
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
    // Open/Close button morphs: "Open Path" when selection is closed, "Close Path" when open.
    const paths = sel.filter((item) => item instanceof paper.Path);
    const allOpen = paths.length > 0 && paths.every((p) => !p.closed);
    const openCloseLabel = allOpen ? msg("close-path") : msg("open-path");
    // Update the mode-tools context bar button if it exists.
    if (modeToolsOCLbl) modeToolsOCLbl.textContent = openCloseLabel;
    if (modeToolsOCBtn) {
      modeToolsOCBtn.title = openCloseLabel;
      if (modDisabledClass) modeToolsOCBtn.classList.toggle(modDisabledClass, !hasPaths);
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
    const selected = paper.project.selectedItems
      .filter((item) => item instanceof paper.Path || item instanceof paper.CompoundPath)
      .sort((a, b) => a.index - b.index); // back→front
    if (selected.length < 2) return;

    // Style from the backmost (bottom) shape.
    const bottomStyle = cloneStyle(selected[0]);

    // Collect all leaf Path nodes, flattening any nested CompoundPaths.
    const leafPaths = [];
    for (const item of selected) {
      item.selected = false; // must deselect BEFORE remove so paper clears it from selectedItems
      if (item instanceof paper.CompoundPath) {
        for (const child of item.children.slice()) {
          leafPaths.push(child.clone());
        }
        item.remove();
      } else {
        leafPaths.push(item.clone());
        item.remove();
      }
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

    const sel = paper.project.selectedItems.filter(
      (item) => item.layer?.data?.isPaintingLayer && item instanceof paper.Path && item.parent instanceof paper.Layer
    );

    if (!sel.length) return;

    for (const path of sel) {
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
  };

  // ── Open/Close button in the mode-tools context bar ───────────────────
  // The mode-tools bar ([class*='mode-tools_mode-tools']) appears next to
  // Fill/Outline/Stroke in the lower-toolbar and shows context-specific
  // buttons (Curved, Pointed, Delete) when path-editing tools are active.
  // We inject Open/Close there, using the same button/icon/label classes as
  // the native buttons, so it looks like a first-class member of the bar.
  // The injection is re-run on every CHANGE_MODE dispatch because React
  // rebuilds the mode-tools children when the active tool changes.

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
    modeToolsOCLbl.textContent = msg("open-path");
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
  // Inserts the Open/Close button after "Pointed" in the Reshape mode-tools
  // bar. Removes it in all other modes. Called on every CHANGE_MODE event
  // because React rebuilds mode-tools children when the active tool changes.
  const injectModeToolsBtn = () => {
    const mode = addon.tab.redux.state?.scratchPaint?.mode;
    if (mode !== "RESHAPE") {
      modeToolsOCBtn.remove();
      return;
    }

    // Find the dashed-border group (contains Curved + Pointed in Reshape mode).
    const dashedGroup = document.querySelector(
      "[class*='mode-tools_mode-tools_'] [class*='mode-tools_mod-dashed-border_']"
    );
    if (!dashedGroup) {
      modeToolsOCBtn.remove();
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

  addon.self.addEventListener("disabled", () => {
    shapingSection?.remove();
    modeToolsOCBtn?.remove();
  });

  // ── Main loop ─────────────────────────────────────────────────────────────
  // Waits for the paint editor toolbar to appear, injects our sections, and
  // wires up all observers. Loops so it re-injects after sprite switches.
  const toolsLoop = async () => {
    let hasRunOnce = false;
    let lastFrontBackRow = null;
    while (true) {
      const frontBackRow = await addon.tab.waitForElement("[class*='fixed-tools_row_'][class*='input-group_']", {
        markAsSeen: true,
        reduxCondition: (state) =>
          state.scratchGui.editorTab.activeTabIndex === 1 && !state.scratchGui.mode.isPlayerOnly,
      });
      lastFrontBackRow = frontBackRow;
      const fixedToolsRow = frontBackRow.parentElement;
      frontBackRow.after(shapingSection);
      shapingSection.style.display = ""; // waitForElement only fires in wide mode

      // Re-apply the separator on every loop iteration: frontBackRow is a React
      // element that gets replaced when the toolbar re-renders at the breakpoint,
      // so the class must be added to each new instance, not just the first one.
      if (dashedBorderClass) frontBackRow.classList.add(dashedBorderClass);

      if (!hasRunOnce) {
        hasRunOnce = true;

        // Extract layout and separator classes from native toolbar elements.
        const nativeDashedGroup = fixedToolsRow.querySelector("[class*='mod-dashed-border_']");
        dashedBorderClass = nativeDashedGroup
          ? [...nativeDashedGroup.classList].find((c) => c.includes("mod-dashed-border")) ?? ""
          : "";

        // Add a dashed separator to the LEFT of our section (right border on preceding group).
        if (dashedBorderClass) frontBackRow.classList.add(dashedBorderClass);
        // Separators between the three inline groups: [unite/subtract/intersect] | [combine] | [expand].
        if (dashedBorderClass) intersectBtn.classList.add(dashedBorderClass);
        if (dashedBorderClass) compoundBtn.classList.add(dashedBorderClass);

        // Copy input-group layout classes (height, flex, alignment) onto our
        // section so the trigger button sits at the right height in the toolbar.
        // Strip the dashed-border class — no right-side separator after us.
        if (nativeDashedGroup) {
          const base = [...nativeDashedGroup.classList].filter((c) => !c.includes("mod-dashed-border")).join(" ");
          shapingSection.className = base + " sa-shaping-section";
        }

        // Capture native button / icon / label classes to apply to our inline items.
        const anyBtn = fixedToolsRow.querySelector("[class*='labeled-icon-button_mod-edit-field_']");
        const anyIcon = fixedToolsRow.querySelector("[class*='labeled-icon-button_edit-field-icon_']");
        const anyTitle = fixedToolsRow.querySelector("[class*='labeled-icon-button_edit-field-title_']");

        const anyDisabled = document.querySelector("[class*='button_mod-disabled_']");
        modDisabledClass = anyDisabled ? [...anyDisabled.classList].find((c) => c.includes("mod-disabled")) ?? "" : "";

        // Style all inline operation items.
        for (const btn of shapingSection.querySelectorAll(".sa-shaping-item")) {
          if (anyBtn) btn.className += " " + anyBtn.className;
          if (modDisabledClass) btn.classList.add(modDisabledClass);
        }
        for (const icon of shapingSection.querySelectorAll(".sa-shaping-item-icon")) {
          if (anyIcon) icon.className += " " + anyIcon.className;
        }
        for (const lbl of shapingSection.querySelectorAll(".sa-shaping-item-label")) {
          if (anyTitle) lbl.className += " " + anyTitle.className;
        }

        // ── Patch React's MediaQuery breakpoint ───────────────────────────
        // react-responsive captures window.matchMedia at bundle evaluation time,
        // so we drive the toolbar layout by patching the fiber tree directly.
        // See breakpoint-patch.js for implementation details.
        const applyPatch = patchToolbarBreakpoint({
          fixedToolsRow,
          onMatchChange: (matches) => {
            shapingSection.style.display = matches ? "" : "none";
          },
          isDisabled: () => addon.self.disabled,
        });

        // Cache the editor container. Re-query only when React has replaced it
        // (isConnected goes false), so we're never holding a stale reference.
        let editorContainer = null;
        const getEditorContainer = () => {
          if (!editorContainer?.isConnected)
            editorContainer = document.querySelector("[class*='paint-editor_editor-container_']");
          return editorContainer;
        };
        document.addEventListener("mouseup", (e) => {
          if (addon.self.disabled) return;
          if (getEditorContainer()?.contains(e.target)) deferUpdateButtonStates();
        });
        document.addEventListener("keyup", (e) => {
          if (addon.self.disabled) return;
          if (getEditorContainer()?.contains(e.target)) deferUpdateButtonStates();
        });
        updateButtonStates();

        // Re-inject the Open/Close button into mode-tools whenever React
        // rebuilds the mode-tools children. Observe the stable fixedToolsRow
        // ancestor (always in DOM) so the observer works even if the mode-tools
        // container is absent at setup time (e.g. during dynamic re-enable).
        const modeToolsObserver = new MutationObserver(() => {
          if (addon.self.disabled) return;
          injectModeToolsBtn();
        });
        modeToolsObserver.observe(fixedToolsRow, { childList: true, subtree: true });

        // Inject our items into the native More popover when it opens.
        const injectMoreItems = (menu) => {
          if (menu.querySelector("[data-sa-op]")) return; // already injected
          // Lazily copy classes from the first native item (a span with an img child).
          if (!moreItemBtnClass) {
            const refItem = [...menu.children].find((el) => el.tagName === "SPAN" && el.querySelector("img"));
            if (refItem) {
              moreItemDisabledClasses = [...refItem.classList].filter((c) => c.includes("mod-disabled"));
              moreItemBtnClass = [...refItem.classList].filter((c) => !c.includes("mod-disabled")).join(" ");
              const refImg = refItem.querySelector("img");
              if (refImg) moreItemIconClass = refImg.className;
            }
          }
          for (const btn of allMoreItems) {
            btn.className = moreItemBtnClass;
            const img = btn.querySelector("img");
            if (img && moreItemIconClass) img.className = moreItemIconClass;
            menu.appendChild(btn);
          }
          deferUpdateButtonStates();
        };

        const moreMenuObserver = new MutationObserver((mutations) => {
          if (addon.self.disabled) return;
          for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
              if (node.nodeType !== Node.ELEMENT_NODE) continue;
              const menu = node.querySelector("[class*='mod-context-menu']");
              if (menu) {
                injectMoreItems(menu);
                return;
              }
            }
          }
        });
        moreMenuObserver.observe(document.body, { childList: true });

        addon.self.addEventListener("disabled", () => modeToolsObserver.disconnect());
        addon.self.addEventListener("disabled", () => moreMenuObserver.disconnect());
        addon.self.addEventListener("reenabled", () => {
          modeToolsObserver.observe(fixedToolsRow, { childList: true, subtree: true });
          moreMenuObserver.observe(document.body, { childList: true });
          applyPatch();
          // Re-insert shapingSection immediately in wide mode — waitForElement
          // won't fire again for an already-seen frontBackRow.
          if (lastFrontBackRow?.isConnected && shapingSection.style.display !== "none") {
            lastFrontBackRow.after(shapingSection);
          }
          injectModeToolsBtn();
        });
        // Initial injection attempt.
        injectModeToolsBtn();
      }
    }
  };

  // ── Apply paper.js hotfixes ───────────────────────────────────────────
  const paper = await addon.tab.traps.getPaper();
  applyHotfixes(addon, paper);

  toolsLoop();
}
