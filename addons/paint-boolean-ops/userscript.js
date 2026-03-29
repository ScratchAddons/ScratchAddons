import TextToPath from "./text-to-path.js";
import PathOffset from "./path-offset.js";

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

  // Trigger button — visible in collapsed (narrow) mode only.
  const shapingBtn = document.createElement("span");
  shapingBtn.className = "sa-shaping-trigger";
  shapingBtn.setAttribute("role", "button");
  shapingBtn.title = msg("shaping");
  const shapingIcon = document.createElement("img");
  shapingIcon.className = "sa-shaping-icon";
  shapingIcon.draggable = false;
  shapingIcon.src = `${addon.self.dir}/icons/shaping.svg`;
  const shapingLbl = document.createElement("span");
  shapingLbl.className = "sa-shaping-label";
  shapingLbl.textContent = msg("shaping");
  shapingBtn.appendChild(shapingIcon);
  shapingBtn.appendChild(shapingLbl);
  shapingSection.appendChild(shapingBtn);

  // Dropdown panel — fixed-position popup shown on hover in collapsed mode.
  const shapingDropdown = document.createElement("div");
  shapingDropdown.className = "sa-shaping-dropdown";
  shapingSection.appendChild(shapingDropdown);

  // Two layout rows inside the dropdown (used in collapsed mode).
  const row1 = document.createElement("div");
  row1.className = "sa-shaping-dropdown-row";
  shapingDropdown.appendChild(row1);
  const row2 = document.createElement("div");
  row2.className = "sa-shaping-dropdown-row";
  shapingDropdown.appendChild(row2);

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
  const allItems = [uniteBtn, subtractBtn, intersectBtn, compoundBtn, expandBtn];

  // Initially place items in the dropdown rows (collapsed is the default until measured).
  row1.append(uniteBtn, subtractBtn, intersectBtn);
  row2.append(compoundBtn, expandBtn);

  // ── Inline ↔ collapsed layout ─────────────────────────────────────────
  // "inline"   : 5 buttons sit directly in the toolbar section (wide toolbar).
  // "collapsed": single trigger button; hovering opens a dropdown panel.
  let shapingMode = "collapsed";

  const setInlineMode = () => {
    if (shapingMode === "inline") return;
    shapingMode = "inline";
    shapingBtn.style.display = "none";
    closeDropdown();
    for (const item of allItems) shapingSection.insertBefore(item, shapingDropdown);
    if (dashedBorderClass) {
      intersectBtn.classList.add(dashedBorderClass);
      compoundBtn.classList.add(dashedBorderClass);
    }
  };

  const setCollapsedMode = () => {
    if (shapingMode === "collapsed") return;
    shapingMode = "collapsed";
    shapingBtn.style.display = "";
    closeDropdown();
    if (dashedBorderClass) intersectBtn.classList.remove(dashedBorderClass);
    row1.append(uniteBtn, subtractBtn, intersectBtn);
    row2.append(compoundBtn, expandBtn);
  };

  // Dropdown open/close on hover with a short leave-delay so the mouse can
  // travel from the trigger into the panel without it flickering closed.
  let closeTimer = null;
  const closeDropdown = () => {
    shapingDropdown.style.display = "none";
  };
  const openDropdown = () => {
    if (closeTimer) {
      clearTimeout(closeTimer);
      closeTimer = null;
    }
    const r = shapingBtn.getBoundingClientRect();
    shapingDropdown.style.left = r.left + "px";
    shapingDropdown.style.top = r.bottom + 2 + "px";
    shapingDropdown.style.display = "flex";
  };
  const scheduleClose = () => {
    closeTimer = setTimeout(() => {
      closeTimer = null;
      closeDropdown();
    }, 120);
  };
  shapingSection.addEventListener("mouseenter", () => {
    if (addon.self.disabled) return;
    if (shapingMode !== "collapsed") return;
    if (modDisabledClass && shapingBtn.classList.contains(modDisabledClass)) return;
    openDropdown();
  });
  shapingSection.addEventListener("mouseleave", () => scheduleClose());
  // The dropdown is outside the section in the DOM flow (fixed position), so
  // keep it open while the pointer is over it directly.
  shapingDropdown.addEventListener("mouseenter", () => {
    if (closeTimer) {
      clearTimeout(closeTimer);
      closeTimer = null;
    }
  });
  shapingDropdown.addEventListener("mouseleave", () => scheduleClose());

  // ── Click handler ─────────────────────────────────────────────────────
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
  // Note: shapingDropdown is a DOM child of shapingSection so clicks already
  // bubble up to the section listener above — no second listener needed.

  // ── Enable/disable buttons based on current paper.js selection ─────────
  // triggerUpdateImage() calls handleUpdateImage() which asynchronously
  // serialises the canvas to SVG, feeds it through Redux, and re-imports it
  // into paper.js — resetting selectedItems in the process. We must wait for
  // that round-trip to finish before reading the new selection state.
  // Two nested requestAnimationFrames ensure we run after React has committed
  // the updated state to the DOM, without relying on a fixed timeout.
  const deferUpdateButtonStates = () => requestAnimationFrame(() => requestAnimationFrame(updateButtonStates));

  const updateButtonStates = async () => {
    if (!modDisabledClass) {
      const anyDisabled = document.querySelector("[class*='button_mod-disabled_']");
      if (anyDisabled) {
        modDisabledClass = [...anyDisabled.classList].find((c) => c.includes("mod-disabled")) ?? "";
        shapingBtn.classList.add(modDisabledClass);
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
    if (modDisabledClass) {
      for (const btn of shapingSection.querySelectorAll("[data-sa-op]")) {
        const op = btn.dataset.saOp;
        let enabled;
        if (op === "unite" || op === "expand") enabled = totalCount >= 1;
        else if (op === "combine" || op === "release") enabled = totalCount >= 2 || hasCompound;
        else enabled = totalCount >= 2; // subtract, intersect
        btn.classList.toggle(modDisabledClass, !enabled);
      }
      // Main trigger: enabled whenever any operation would be available.
      shapingBtn.classList.toggle(modDisabledClass, totalCount < 1 && !hasCompound);
    }
    // Compound button morphs: combine ↔ release based on selection.
    const compoundOp = hasMultiple ? "combine" : hasCompound ? "release" : "combine";
    compoundBtn.dataset.saOp = compoundOp;
    compoundBtn.title = msg(`${compoundOp}-desc`);
    compoundBtn.querySelector(".sa-shaping-item-icon").src = `${addon.self.dir}/icons/${compoundOp}.svg`;
    compoundBtn.querySelector(".sa-shaping-item-label").textContent = msg(compoundOp);
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

  // ── Boolean operations: unite / subtract / intersect ───────────────────
  // Returns true if the path/compound-path is degenerate (zero-area sliver,
  // single-point artefact, etc.) and should be discarded.
  const isDegenerate = (r) => {
    if (!r) return true;
    if (r.children) {
      // CompoundPath: degenerate if every child is degenerate.
      return r.children.length === 0 || r.children.every(isDegenerate);
    }
    // Path: must have ≥ 3 segments and meaningful area.
    if (!r.segments || r.segments.length < 3) return true;
    if (Math.abs(r.area) < 1) return true;
    return false;
  };
  // Strips degenerate children from a CompoundPath in-place, then removes r
  // and returns null if the whole result is degenerate, otherwise returns r.
  const cleanResult = (r) => {
    if (!r) return null;
    if (r.children) {
      for (const child of r.children.slice()) {
        if (isDegenerate(child)) child.remove();
      }
      // Unwrap a single-child CompoundPath to a plain Path.
      if (r.children.length === 1) r = r.reduce();
    }
    if (isDegenerate(r)) {
      r.remove();
      return null;
    }
    return r;
  };
  // Normalise paths before boolean ops. Scratch sometimes stores circles as
  // open paths whose last segment coincides with the first — paper.js boolean
  // ops treat open paths differently, producing corrupt results. Convert these
  // to proper closed paths by transferring the last segment's handleIn to the
  // first (preserving the closing arc's tangent) then removing the duplicate.
  const preprocessPaths = (items, paper) => {
    for (const item of items) {
      if (!(item instanceof paper.Path || item instanceof paper.CompoundPath)) continue;
      const paths = item instanceof paper.CompoundPath ? item.children.slice() : [item];
      for (const path of paths) {
        if (!path.closed && path.segments.length >= 2) {
          const first = path.segments[0];
          const last = path.segments[path.segments.length - 1];
          if (first.point.getDistance(last.point) < 0.01) {
            first.handleIn = last.handleIn;
            last.remove();
            path.closed = true;
          }
        }
      }
    }
  };

  // Converts selected PointText items on the painting layer to path outlines
  // in-place, using paper.js's toPath() method. Returns the number of items
  // successfully converted.
  // Converts selected PointText items to path outlines using rasterize+trace.
  // Returns the number of items successfully converted.
  const convertTextItems = (paper) => {
    const textItems = paper.project.selectedItems.filter(
      (item) => item instanceof paper.PointText && item.layer?.data?.isPaintingLayer
    );
    let count = 0;
    for (const textItem of textItems) {
      const path = TextToPath.convert(textItem, paper);
      if (!path) continue;
      path.fillColor = textItem.fillColor ? textItem.fillColor.clone() : null;
      path.strokeColor = textItem.strokeColor ? textItem.strokeColor.clone() : null;
      path.strokeWidth = textItem.strokeWidth;
      const idx = textItem.index;
      const layer = textItem.layer;
      textItem.selected = false;
      textItem.remove();
      layer.insertChild(idx, path);
      path.selected = true;
      count++;
    }
    return count;
  };

  // ── Shared style helpers ───────────────────────────────────────────────
  // paper.js boolean ops reliably corrupt/lose item styles, so we snapshot
  // before ops and restore after via these two helpers.
  const cloneStyle = (src) => ({
    fillColor: src.fillColor ? src.fillColor.clone() : null,
    strokeColor: src.strokeColor ? src.strokeColor.clone() : null,
    strokeWidth: src.strokeWidth,
  });
  const applyStyle = (dst, style) => {
    dst.fillColor = style.fillColor;
    dst.strokeColor = style.strokeColor;
    dst.strokeWidth = style.strokeWidth;
  };

  // Returns the selected painting-layer closed paths/compounds sorted back→front.
  // Includes Scratch's pseudo-open circles (first point ≈ last point).
  const getPaintingSelected = (paper) =>
    paper.project.selectedItems
      .filter(
        (item) =>
          item.layer?.data?.isPaintingLayer &&
          // Exclude child paths of a CompoundPath — when a CompoundPath is
          // selected, paper.js also puts all its child Paths into selectedItems.
          // Including them causes unite to operate on sub-paths individually,
          // destroying holes and ultimately erasing the shape entirely.
          !(item instanceof paper.Path && item.parent instanceof paper.CompoundPath) &&
          ((item instanceof paper.Path &&
            (item.closed ||
              (item.segments.length >= 2 &&
                item.segments[0].point.getDistance(item.segments[item.segments.length - 1].point) < 0.01))) ||
            item instanceof paper.CompoundPath)
      )
      .sort((a, b) => a.index - b.index);

  // Returns the top-level selected items on the painting layer, back→front.
  // "Top-level" means direct children of the Layer (not inside a Group).
  // Includes paper.Group so that Scratch groups count as one atomic unit.
  const getTopLevelSelected = (paper) =>
    paper.project.selectedItems
      .filter(
        (item) =>
          item.layer?.data?.isPaintingLayer &&
          (item instanceof paper.Path || item instanceof paper.CompoundPath || item instanceof paper.Group) &&
          item.parent instanceof paper.Layer
      )
      .sort((a, b) => a.index - b.index);

  // Recursively collects all leaf Path/CompoundPath nodes from an item.
  // Descends into Groups; treats Path and CompoundPath as leaves (not descended).
  const getLeafPaths = (item, paper) => {
    if (item instanceof paper.Group) return item.children.flatMap((c) => getLeafPaths(c, paper));
    return [item];
  };

  // Recursively subtracts all cutterLeaves from every leaf in item, rebuilding
  // the original Group nesting at every depth. Returns the rebuilt item, or
  // null if the item was entirely cut away.
  const subtractCuttersFrom = (item, cutterLeaves, paper) => {
    if (item instanceof paper.Group) {
      const rebuilt = item.children
        .slice()
        .map((c) => subtractCuttersFrom(c, cutterLeaves, paper))
        .filter(Boolean);
      return rebuilt.length > 0 ? new paper.Group(rebuilt) : null;
    }
    // Leaf: clone, subtract each cutter in sequence (A-(B∪C) = (A-B)-C).
    const style = cloneStyle(item);
    let current = item.clone();
    for (const cutter of cutterLeaves) {
      const prev = current;
      current = prev.subtract(cutter);
      if (current !== prev) prev.remove();
    }
    const cleaned = cleanResult(current);
    if (cleaned) applyStyle(cleaned, style);
    else current.remove();
    return cleaned;
  };

  // Collapses an item (potentially a nested Group) into a single flat region
  // by uniting all its leaf shapes. Returns a temporary paper item — caller
  // must .remove() it when done.
  const itemToRegion = (item, paper) => {
    const leaves = getLeafPaths(item, paper);
    let region = leaves[0].clone();
    for (let i = 1; i < leaves.length; i++) {
      const prev = region;
      region = prev.unite(leaves[i]);
      if (region !== prev) prev.remove();
    }
    return region;
  };

  // Recursively intersects every leaf in item with each clipRegion in sequence
  // (A∩R1∩R2…), rebuilding the original Group nesting. Each clipRegion is a
  // single pre-built shape (one per upper top-level item). Returns the rebuilt
  // item, or null if no overlap remains.
  const intersectRegionsFrom = (item, clipRegions, paper) => {
    if (item instanceof paper.Group) {
      const rebuilt = item.children
        .slice()
        .map((c) => intersectRegionsFrom(c, clipRegions, paper))
        .filter(Boolean);
      return rebuilt.length > 0 ? new paper.Group(rebuilt) : null;
    }
    const style = cloneStyle(item);
    let current = item.clone();
    for (const clip of clipRegions) {
      const prev = current;
      current = prev.intersect(clip);
      if (current !== prev) prev.remove();
    }
    const cleaned = cleanResult(current);
    if (cleaned) applyStyle(cleaned, style);
    else current.remove();
    return cleaned;
  };

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
      if (upperCopies) {
        for (const c of upperCopies) {
          c.bringToFront();
          c.selected = true;
        }
      }
      // Intersect+Alt: restore just the topmost clip shape and select it.
      if (topCopy) {
        topCopy.bringToFront();
        topCopy.selected = true;
      }
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
    if (topClone) topClone.bringToFront();
    triggerUpdateImage();
    deferUpdateButtonStates();
  };

  // ── Punch Through (Shift+Subtract): topmost top-level item (or group) cuts
  // every leaf in every other top-level item. The cutter item is removed.
  //
  // Process targets front→back (high index first): inserting results at a high
  // position doesn't shift the indices of lower (unprocessed) targets.
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
    // Restore the cutter and select it too.
    if (topCopy) {
      topCopy.bringToFront();
      topCopy.selected = true;
    }
    triggerUpdateImage();
    deferUpdateButtonStates();
  };

  // ── Divide: split all shapes into every distinct non-overlapping region ───
  // Matching Illustrator's Divide Pathfinder: A circle and a half-covering
  // rectangle → 3 pieces (crescent, overlap, rectangle-overhang).
  //
  // Algorithm (back→front):
  //   • Seed with the backmost shape as the first region.
  //   • For each subsequent shape, split every existing region at the new
  //     shape's boundary into (overlap) and (remainder).
  //     - overlap takes the incoming shape's colour (it's on top).
  //     - remainder keeps its existing colour.
  //   • Also emit the part of the incoming shape not covered by any prior
  //     region (the "exclusive" fragment).
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

  // ── Combine: CompoundPath with punch-through holes ─────────────────────
  // Use the even-odd fill rule: a point inside an ODD number of sub-paths is
  // filled; inside an EVEN number = transparent hole. This works correctly for
  // both fully-contained shapes AND partially-overlapping shapes — no winding
  // manipulation needed.
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

  // ── Release: split CompoundPath back into individual Paths ─────────────
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

  // ── Outline Expand / Contract ──────────────────────────────────────────
  // Applies PathOffset to every selected path/compound/group in the painting
  // layer. Text items are converted to paths first.
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
      const amount = (item.strokeWidth ?? 0) / 2 || 1;
      const style = cloneStyle(item);
      const raw = PathOffset.offset(item, amount, paper);
      // cleanResult strips tiny artifact fragments (area < 1) that paper.js's
      // intersection engine can produce when resolving the self-union in #clean.
      const result = raw ? cleanResult(raw) : null;
      if (!result) continue;
      applyStyle(result, style);
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

  // ── Open / Close: toggle selected paths between open and closed ─────────
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

  // ── Trigger scratch-paint undo snapshot ───────────────────────────────
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

  // Inject (or re-inject) the Open/Close button after "Pointed" in the
  // mode-tools context bar — but ONLY in the Reshape/path-editing context.
  //
  // Detection: the Reshape context is the only mode that renders a group with
  // class mode-tools_mod-dashed-border (contains Curved + Pointed). Drawing
  // tools (pen, ellipse, etc.) never render that group, so we remove the button
  // when it's absent and inject inside that group when it's present.
  // Result layout: [Curved] [Pointed] [Open/Close] | [Delete]
  // Inject (or re-inject) the Open/Close button after "Pointed" in the
  // mode-tools context bar — but ONLY in the Reshape/path-editing context.
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

  // ── Inject both sections into the fixed-tools row ─────────────────────
  // We wait for the Front/Back sub-row specifically, then insert our sections
  // immediately after it. Class names are read from live DOM elements at
  // runtime so any future hash changes are handled automatically.
  const toolsLoop = async () => {
    let hasRunOnce = false;
    let lastFrontBackRow = null;
    const updateLayout = () => (window.innerWidth >= 1600 ? setInlineMode() : setCollapsedMode());
    while (true) {
      const frontBackRow = await addon.tab.waitForElement("[class*='fixed-tools_row_'][class*='input-group_']", {
        markAsSeen: true,
        reduxCondition: (state) =>
          state.scratchGui.editorTab.activeTabIndex === 1 && !state.scratchGui.mode.isPlayerOnly,
      });
      lastFrontBackRow = frontBackRow;
      const fixedToolsRow = frontBackRow.parentElement;
      closeDropdown(); // ensure panel is closed on each reinsertion
      frontBackRow.after(shapingSection);
      updateLayout(); // re-evaluate inline vs collapsed after (re)insertion

      if (!hasRunOnce) {
        hasRunOnce = true;

        // Extract layout and separator classes from native toolbar elements.
        const nativeDashedGroup = fixedToolsRow.querySelector("[class*='mod-dashed-border']");
        dashedBorderClass = nativeDashedGroup
          ? ([...nativeDashedGroup.classList].find((c) => c.includes("mod-dashed-border")) ?? "")
          : "";

        // Add a dashed separator to the LEFT of our section (right border on preceding group).
        if (dashedBorderClass) frontBackRow.classList.add(dashedBorderClass);
        // Also apply immediately to compoundBtn for collapsed mode.
        if (dashedBorderClass) compoundBtn.classList.add(dashedBorderClass);

        // Copy input-group layout classes (height, flex, alignment) onto our
        // section so the trigger button sits at the right height in the toolbar.
        // Strip the dashed-border class — no right-side separator after us.
        if (nativeDashedGroup) {
          const base = [...nativeDashedGroup.classList].filter((c) => !c.includes("mod-dashed-border")).join(" ");
          shapingSection.className = base + " sa-shaping-section";
        }

        // Clone button / icon / label classes for the trigger button so it
        // matches the native toolbar button appearance.
        const anyBtn = fixedToolsRow.querySelector("[class*='labeled-icon-button_mod-edit-field_']");
        const anyIcon = fixedToolsRow.querySelector("[class*='labeled-icon-button_edit-field-icon_']");
        const anyTitle = fixedToolsRow.querySelector("[class*='labeled-icon-button_edit-field-title_']");

        const anyDisabled = document.querySelector("[class*='button_mod-disabled_']");
        modDisabledClass = anyDisabled
          ? ([...anyDisabled.classList].find((c) => c.includes("mod-disabled")) ?? "")
          : "";

        if (anyBtn) shapingBtn.className += " " + anyBtn.className;
        if (anyIcon) shapingIcon.className += " " + anyIcon.className;
        if (anyTitle) shapingLbl.className += " " + anyTitle.className;
        if (modDisabledClass) shapingBtn.classList.add(modDisabledClass);

        // Style all operation items (inline and dropdown share the same elements).
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

        // ── Adaptive layout: inline ≥1600px window width, collapsed below ──
        updateLayout();
        window.addEventListener("resize", updateLayout);

        const editorContainer = document.querySelector("[class*='paint-editor_editor-container_']");
        if (editorContainer) {
          editorContainer.addEventListener("mouseup", deferUpdateButtonStates);
        }
        document.addEventListener("keyup", () => {
          if (addon.self.disabled) return;
          if (document.querySelector("[class*='paint-editor_editor-container_']")) {
            deferUpdateButtonStates();
          }
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
        addon.self.addEventListener("disabled", () => modeToolsObserver.disconnect());
        addon.self.addEventListener("reenabled", () => {
          modeToolsObserver.observe(fixedToolsRow, { childList: true, subtree: true });
          // Re-insert shapingSection immediately — waitForElement won't fire again
          // for the already-seen frontBackRow until React re-renders it.
          if (lastFrontBackRow?.isConnected) {
            lastFrontBackRow.after(shapingSection);
            updateLayout();
          }
          injectModeToolsBtn();
        });
        // Initial injection attempt.
        injectModeToolsBtn();
      }
    }
  };

  // ── Shared paper reference for both hotfixes below ───────────────────
  const _fixPaper = await addon.tab.traps.getPaper();

  // ── Hotfix: stuck modifier keys after Alt+Tab ────────────────────────
  // When the user presses Alt+Tab to switch away, the browser never fires
  // a keyup event for Alt. paper.js caches modifier state in
  // paper.Key.modifiers and never resets it, so the next drag is treated
  // as an alt-drag and triggers an unwanted clone.
  //
  // window blur / visibilitychange do not reliably fire when Alt+Tab shifts
  // OS focus away in Chrome on Windows, so we can't use those.
  //
  // Instead, intercept mousedown in capture phase — which runs before
  // paper.js reads modifiers — and sync paper.Key.modifiers against the
  // native event's real hardware state. MouseEvent.altKey/shiftKey etc.
  // always reflect actual key state regardless of what paper.js cached.
  // Guarded by the "fix-stuck-modifiers" setting.
  const _syncModifiers = (e) => {
    if (addon.self.disabled) return;
    if (!addon.settings.get("fix-stuck-modifiers")) return;
    const m = _fixPaper?.Key?.modifiers;
    if (!m) return;
    if (!e.altKey) m.alt = false;
    if (!e.shiftKey) m.shift = false;
    if (!e.ctrlKey) m.control = false;
    if (!e.metaKey) m.meta = false;
  };
  document.addEventListener("mousedown", _syncModifiers, true);
  addon.self.addEventListener("disabled", () => document.removeEventListener("mousedown", _syncModifiers, true));
  addon.self.addEventListener("reenabled", () => document.addEventListener("mousedown", _syncModifiers, true));

  // ── Hotfix: CompoundPath deselection cascade ──────────────────────────
  // scratch-paint's cloneSelection() calls `item.selected = false` on the
  // original CompoundPath after cloning it. In @scratch/paper, this does
  // NOT cascade to child Path items — they stay selected. scratch-paint's
  // getSelectedRootItems() has a fallback that includes a CompoundPath
  // whenever any of its children are selected, even if the CP itself is
  // not. Result: both the original (via still-selected children) and the
  // clone (via its own selected=true) land in this.selectedItems, and both
  // get dragged to the destination.
  //
  // Fix: shadow the `selected` setter on CompoundPath.prototype so that
  // deselecting a CompoundPath also deselects its children. The cascade is
  // gated on the "fix-compound-deselect" setting at call time, so toggling
  // the setting takes effect immediately without unpatching the prototype.
  // The patch is applied once and guarded against re-application on
  // dynamic re-enable via a flag on the prototype.
  // Guard against being applied twice (e.g. on dynamic re-enable).
  if (!_fixPaper.CompoundPath.prototype._sa_deselect_cascade_patched) {
    // Walk the prototype chain to find the prototype that actually owns
    // the `selected` accessor (may be on a parent class, not CP itself).
    let _selectedDesc = null;
    let _proto = _fixPaper.CompoundPath.prototype;
    while (_proto && _proto !== Object.prototype) {
      const d = Object.getOwnPropertyDescriptor(_proto, "selected");
      if (d?.set) {
        _selectedDesc = d;
        break;
      }
      _proto = Object.getPrototypeOf(_proto);
    }

    if (_selectedDesc?.set) {
      const _origSet = _selectedDesc.set;
      const _origGet = _selectedDesc.get;
      const _addon = addon;
      Object.defineProperty(_fixPaper.CompoundPath.prototype, "selected", {
        get: _origGet,
        set: function (selected) {
          _origSet.call(this, selected);
          if (!selected && !_addon.self.disabled && _addon.settings.get("fix-compound-deselect")) {
            const children = this._children ?? this.children;
            if (children) {
              for (let i = 0; i < children.length; i++) {
                if (children[i].selected) {
                  children[i].selected = false;
                }
              }
            }
          }
        },
        configurable: true,
        enumerable: _selectedDesc.enumerable ?? false,
      });
      _fixPaper.CompoundPath.prototype._sa_deselect_cascade_patched = true;
    }
  }

  toolsLoop();
}
