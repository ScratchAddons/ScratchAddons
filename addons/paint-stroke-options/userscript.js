export default async function ({ addon, msg, console }) {
  addon.tab.redux.initialize();

  // ── Apply a paper.js stroke property to all selected items ────────────────
  const applyProp = async (prop, value) => {
    const paper = await addon.tab.traps.getPaper();
    const items = paper.project.selectedItems.filter((item) => item.parent instanceof paper.Layer);
    if (items.length === 0) return;
    for (const item of items) {
      item[prop] = value;
    }
    // Trigger undo snapshot via React fiber walk.
    const canvasContainer = document.querySelector("[class^='paint-editor_canvas-container']");
    if (!canvasContainer) {
      return;
    }
    let fiber = canvasContainer[addon.tab.traps.getInternalKey(canvasContainer)];
    while (fiber && typeof fiber.stateNode?.handleUpdateImage !== "function") {
      fiber = fiber.return;
    }
    if (fiber?.stateNode?.handleUpdateImage) {
      fiber.stateNode.handleUpdateImage();
    }
  };

  // ── Read current common value across all selected items ───────────────────
  const getCommonProp = async (prop) => {
    const paper = await addon.tab.traps.getPaper();
    const items = paper.project.selectedItems.filter((item) => item.parent instanceof paper.Layer);
    if (items.length === 0) return null;
    const values = [...new Set(items.map((i) => i[prop]))];
    return values.length === 1 ? values[0] : null; // null = mixed
  };

  // ── Main loop — re-runs every time the color picker popup reopens ─────────
  while (true) {
    const swatchRow = await addon.tab.waitForElement('div[class*="color-picker_swatch-row"]', {
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
      await applyProp(prop, btn.dataset.saVal);
      updateActive();
    });

    // ── Active state ──────────────────────────────────────────────────────
    const updateActive = async () => {
      const currentJoin = await getCommonProp("strokeJoin");
      const currentCap = await getCommonProp("strokeCap");
      for (const btn of wrapper.querySelectorAll(".sa-stroke-opt-btn")) {
        const active =
          btn.dataset.saOp === "join"
            ? btn.dataset.saVal === (currentJoin ?? "miter")
            : btn.dataset.saVal === (currentCap ?? "butt");
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
