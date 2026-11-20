export default async function ({ addon, msg, console }) {
  addon.tab.redux.initialize();

  // ── Remember the user's last-picked join/cap so newly drawn shapes can use them ──
  let defaultJoin = "miter";
  let defaultCap = "butt";

  // ── Apply the remembered defaults to a shape as it's drawn ─────────────────
  // Scratch-paint creates a new tool instance every time its mode is activated, so this
  // just guards against patching the same instance twice if handleModeChange fires again.
  const patchToolDefaults = (paper, mode) => {
    const tool = paper.tool;
    if (!tool || tool.saStrokeOptsPatched) return;
    tool.saStrokeOptsPatched = true;

    const applyDefaults = (item) => {
      if (!item) return;
      item.strokeJoin = defaultJoin;
      item.strokeCap = defaultCap;
    };

    if (mode === "RECT" || mode === "OVAL") {
      // Rect/oval tools rebuild their preview shape on every drag frame, so re-apply each time.
      const origMouseDrag = tool.onMouseDrag;
      tool.onMouseDrag = function (event) {
        origMouseDrag?.call(this, event);
        applyDefaults(mode === "RECT" ? this.rect : this.oval);
      };
    } else if (mode === "LINE") {
      // Only apply to a brand new line, not one continued from an existing endpoint
      // (continuing doesn't add a new item to the layer).
      const origMouseDown = tool.onMouseDown;
      tool.onMouseDown = function (event) {
        const itemCountBefore = paper.project.activeLayer.children.length;
        origMouseDown?.call(this, event);
        if (paper.project.activeLayer.children.length > itemCountBefore) {
          applyDefaults(paper.project.activeLayer.lastChild);
        }
      };
    }
  };

  // Patch the active tool whenever the draw mode changes (and once up front, in
  // case a relevant tool is already active).
  const handleModeChange = async () => {
    const mode = addon.tab.redux.state?.scratchPaint?.mode;
    if (mode !== "RECT" && mode !== "OVAL" && mode !== "LINE") return;
    patchToolDefaults(await addon.tab.traps.getPaper(), mode);
  };
  addon.tab.redux.addEventListener("statechanged", ({ detail }) => {
    if (detail.action.type === "scratch-paint/modes/CHANGE_MODE") queueMicrotask(handleModeChange);
  });
  handleModeChange();

  const getSelectedStrokeItems = (paper) => {
    const items = new Set();
    for (const item of paper.project.selectedItems) {
      // Reshape can select a child without selecting its group. Use the selected
      // shapes, as Scratch's outline width control does, and ignore selection helpers.
      if (
        item instanceof paper.Layer ||
        item instanceof paper.Group ||
        item.data?.isSelectionBound ||
        item.data?.isHelperItem
      ) {
        continue;
      }
      // Compound path children share their parent's style. Several selected
      // children can refer to the same parent, so only include it once.
      items.add(item.parent instanceof paper.CompoundPath ? item.parent : item);
    }
    return [...items];
  };

  // ── Apply a paper.js stroke property to all selected items ────────────────
  const applyProp = async (prop, value) => {
    const paper = await addon.tab.traps.getPaper();
    const items = getSelectedStrokeItems(paper);
    if (items.length === 0) return;
    for (const item of items) {
      item[prop] = value;
    }
    // Trigger undo snapshot via React fiber walk.
    const canvasContainer = document.querySelector("[class*='paint-editor_canvas-container_']");
    if (!canvasContainer) {
      return;
    }
    let fiber = canvasContainer[addon.tab.traps.getInternalKey(canvasContainer)];
    // Walking .return always terminates: the fiber tree has finite depth, and the root fiber's .return is null.
    while (fiber && typeof fiber.stateNode?.handleUpdateImage !== "function") {
      fiber = fiber.return;
    }
    if (fiber) {
      fiber.stateNode.handleUpdateImage();
    }
  };

  // ── Read current common value across all selected items ───────────────────
  const getCommonProp = (items, prop, defaultValue) => {
    // Defaults describe the next shape only when nothing is selected.
    // Mixed selections have no active button until the user chooses a style.
    if (items.length === 0) return defaultValue;
    const values = [...new Set(items.map((i) => i[prop]))];
    return values.length === 1 ? values[0] : null; // null = mixed
  };

  const paper = await addon.tab.traps.getPaper();
  const rememberSelectedStyle = () => {
    if (addon.self.disabled) return;
    const items = getSelectedStrokeItems(paper);
    // Keep each common style for the next shape. An empty or mixed selection
    // should leave that setting as it was.
    defaultJoin = getCommonProp(items, "strokeJoin") ?? defaultJoin;
    defaultCap = getCommonProp(items, "strokeCap") ?? defaultCap;
  };
  addon.tab.redux.addEventListener("statechanged", ({ detail }) => {
    if (detail.action.type === "scratch-paint/select/CHANGE_SELECTED_ITEMS") {
      // Read the styles now, before switching tools clears the Paper selection.
      rememberSelectedStyle();
    }
  });
  addon.self.addEventListener("reenabled", rememberSelectedStyle);
  rememberSelectedStyle();

  // ── Main loop — re-runs every time the color picker popup reopens ─────────
  while (true) {
    const swatchRow = await addon.tab.waitForElement('div[class*="color-picker_swatch-row_"]', {
      markAsSeen: true,
      reduxCondition: (state) => state.scratchGui.editorTab.activeTabIndex === 1 && !state.scratchGui.mode.isPlayerOnly,
    });

    // Skip the fill color popup — these controls only apply to strokes.
    if (!addon.tab.redux.state?.scratchPaint?.modals?.strokeColor) continue;

    // ── Build widget ──────────────────────────────────────────────────────
    const wrapper = document.createElement("div");
    wrapper.className = "sa-stroke-opts-wrapper";
    addon.tab.displayNoneWhileDisabled(wrapper);

    const inner = document.createElement("div");
    inner.className = "sa-stroke-opts-inner";
    wrapper.appendChild(inner);

    const buildGroup = (captionKey, buttons) => {
      const group = document.createElement("div");
      group.className = "sa-stroke-opts-group";

      const caption = document.createElement("span");
      caption.className = addon.tab.scratchClass("color-picker_label-name");
      const captionInner = document.createElement("span");
      captionInner.textContent = msg(captionKey);
      caption.appendChild(captionInner);
      group.appendChild(caption);

      const row = document.createElement("div");
      row.className = "sa-stroke-opts-btns";
      for (const [op, value, titleKey] of buttons) {
        const btn = document.createElement("button");
        btn.className = "sa-stroke-opt-btn";
        btn.dataset.saOp = op;
        btn.dataset.saVal = value;
        btn.title = msg(titleKey);
        btn.setAttribute("aria-label", msg(titleKey));
        const img = document.createElement("img");
        img.draggable = false;
        img.src = `${addon.self.dir}/icons/${op}-${value}.svg`;
        btn.appendChild(img);
        row.appendChild(btn);
      }
      group.appendChild(row);
      return group;
    };

    // Corner/join group (left, 2 buttons) then Cap group (right, 3 buttons)
    inner.appendChild(
      buildGroup("corner", [
        ["join", "miter", "join-miter"],
        ["join", "round", "join-round"],
      ])
    );
    inner.appendChild(
      buildGroup("cap", [
        ["cap", "butt", "cap-butt"],
        ["cap", "round", "cap-round"],
        ["cap", "square", "cap-square"],
      ])
    );

    // ── Click handler ─────────────────────────────────────────────────────
    wrapper.addEventListener("click", async (e) => {
      if (addon.self.disabled) return;
      const btn = e.target.closest(".sa-stroke-opt-btn");
      if (!btn) return;
      const prop = btn.dataset.saOp === "join" ? "strokeJoin" : "strokeCap";
      if (btn.dataset.saOp === "join") {
        defaultJoin = btn.dataset.saVal;
      } else {
        defaultCap = btn.dataset.saVal;
      }
      await applyProp(prop, btn.dataset.saVal);
      updateActive();
    });

    // ── Active state ──────────────────────────────────────────────────────
    const updateActive = async () => {
      const paper = await addon.tab.traps.getPaper();
      const items = getSelectedStrokeItems(paper);
      const currentJoin = getCommonProp(items, "strokeJoin", defaultJoin);
      const currentCap = getCommonProp(items, "strokeCap", defaultCap);
      for (const btn of wrapper.querySelectorAll(".sa-stroke-opt-btn")) {
        const active =
          btn.dataset.saOp === "join" ? btn.dataset.saVal === currentJoin : btn.dataset.saVal === currentCap;
        btn.classList.toggle("sa-stroke-opt-active", active);
      }
    };

    // Insert AFTER the swatch row — bottom of the popup.
    const divider = document.createElement("div");
    divider.className = addon.tab.scratchClass("color-picker_divider");
    addon.tab.displayNoneWhileDisabled(divider);
    swatchRow.after(divider);
    divider.after(wrapper);
    updateActive();
  }
}
