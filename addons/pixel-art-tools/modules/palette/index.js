import { createStorageModule } from "./storage.js";
import { createUIModule } from "./ui.js";
import { createImportExportModule } from "./import-export.js";

export function createPaletteModule(addon, state, redux, msg) {
  const vm = addon.tab.traps.vm;
  const runtime = vm.runtime;

  Object.assign(state, {
    projectPalettes: state.projectPalettes || [],
    selectedPaletteId: state.selectedPaletteId || null,
    paletteDropdown: null,
    teardownVmTargetsListener: null,
  });

  const ui = createUIModule(addon, state, redux, msg, null, null);
  const storage = createStorageModule(addon, vm, runtime, msg, state, ui);
  const importExport = createImportExportModule(state, storage);
  ui.setDependencies(storage, importExport);

  const createPalette = (name) => ({
    id: `pal-${storage.randomId()}`,
    name: name || `${msg("paletteTitle") || "Palette"} ${state.projectPalettes.length + 1}`,
    colors: [],
  });

  const ensureActivePalette = () => {
    if (!state.projectPalettes.length) {
      const palette = createPalette();
      state.projectPalettes.push(palette);
      state.selectedPaletteId = palette.id;
      state.palette = palette.colors;
    }
    if (!state.selectedPaletteId) {
      const palette = state.projectPalettes[0];
      state.selectedPaletteId = palette.id;
      state.palette = palette.colors;
    }
  };

  const setActivePalette = (paletteId, persistCostume = true) => {
    const palette = state.projectPalettes.find((p) => p.id === paletteId);
    if (!palette) return;
    Object.assign(state, {
      selectedPaletteId: paletteId,
      palette: palette.colors,
      editingPaletteIndex: -1,
      selectedPaletteIndex: -1,
    });
    ui.renderSelector();
    ui.renderPalette();
    ui.updatePaletteSelection();
    if (persistCostume) storage.writeCostumePaletteId(paletteId);
  };

  const syncPalette = () => {
    const currentPaletteId = state.selectedPaletteId;
    const loaded = storage.loadProjectPalettes();
    if (loaded.length) state.projectPalettes = loaded;
    ensureActivePalette();

    const paletteId = storage.readCostumePaletteId();
    if (paletteId && state.projectPalettes.some((p) => p.id === paletteId)) {
      setActivePalette(paletteId, false);
    } else if (currentPaletteId && state.projectPalettes.some((p) => p.id === currentPaletteId)) {
      setActivePalette(currentPaletteId, false);
    } else {
      setActivePalette(state.projectPalettes[0].id);
    }
  };

  let syncPending = false;
  const scheduleSync = () => {
    if (syncPending) return;
    syncPending = true;
    queueMicrotask(() => {
      syncPending = false;
      syncPalette();
    });
  };

  const setupPalettePanel = async () => {
    const panel = Object.assign(document.createElement("section"), { className: "sa-pixel-art-palette" });
    panel.style.display = "none";
    addon.tab.displayNoneWhileDisabled(panel);

    const header = Object.assign(document.createElement("header"), {
      className: "sa-pixel-art-palette-header",
      textContent: msg("paletteTitle"),
    });
    panel.appendChild(header);

    // Draggable when floating
    let dragStart = null;
    header.onmousedown = (e) => panel.dataset.floating && (dragStart = { x: e.clientX - panel.offsetLeft, y: e.clientY - panel.offsetTop });
    document.addEventListener("mousemove", (e) => dragStart && Object.assign(panel.style, { left: `${e.clientX - dragStart.x}px`, top: `${e.clientY - dragStart.y}px`, right: "auto" }));
    document.addEventListener("mouseup", () => (dragStart = null));

    // Float when narrow viewport
    let floating = false;
    const updateFloat = () => {
      const shouldFloat = window.innerWidth < 1256;
      if (shouldFloat === floating) return;
      floating = shouldFloat;
      const canvas = document.querySelector("[class*='paper-canvas_paper-canvas']");
      if (shouldFloat && canvas) {
        panel.dataset.floating = "true";
        canvas.parentElement.appendChild(panel);
        Object.assign(panel.style, { right: "10px", top: "10px", left: "auto" });
      } else {
        delete panel.dataset.floating;
        Object.assign(panel.style, { left: "", top: "", right: "" });
        document.querySelector("[class*='paint-editor_mode-selector']")?.appendChild(panel);
      }
    };
    window.addEventListener("resize", updateFloat);

    const selectorRow = Object.assign(document.createElement("div"), { className: "sa-pixel-art-palette-select-row" });
    const dropdown = Object.assign(document.createElement("select"), { className: "sa-pixel-art-palette-select" });
    dropdown.onchange = (e) => {
      if (e.target.value === "__create__") {
        const newPalette = createPalette();
        state.projectPalettes.push(newPalette);
        setActivePalette(newPalette.id);
        storage.writeProjectComment(state.projectPalettes);
      } else if (e.target.value) {
        setActivePalette(e.target.value);
      }
    };

    selectorRow.appendChild(dropdown);
    panel.appendChild(selectorRow);
    state.paletteDropdown = dropdown;

    const notice = Object.assign(document.createElement("p"), {
      className: "sa-pixel-art-palette-empty",
      textContent: msg("emptyPalette"),
    });
    panel.appendChild(notice);
    state.paletteNotice = notice;

    const grid = Object.assign(document.createElement("div"), { className: "sa-pixel-art-palette-grid" });
    panel.appendChild(grid);
    state.paletteGrid = grid;

    const messageArea = Object.assign(document.createElement("div"), { className: "sa-pixel-art-palette-message" });
    messageArea.style.display = "none";
    panel.appendChild(messageArea);
    state.paletteMessage = messageArea;

    // Add import/export actions
    const { importInput, importBtn, exportBtn, deleteBtn } = ui.createActionButtons(storage.handleDeletePalette);
    panel.appendChild(importInput);

    const actionsRow = Object.assign(document.createElement("div"), { className: "sa-pixel-art-palette-actions" });
    actionsRow.append(importBtn, exportBtn, deleteBtn);
    panel.appendChild(actionsRow);

    state.palettePanel = panel;

    while (true) {
      await addon.tab.waitForElement("[class*='paint-editor_mode-selector']", {
        markAsSeen: true,
        reduxEvents: [
          "scratch-gui/navigation/ACTIVATE_TAB",
          "scratch-gui/targets/UPDATE_TARGET_LIST",
          "scratch-paint/formats/CHANGE_FORMAT",
        ],
        reduxCondition: (store) =>
          store.scratchGui.editorTab.activeTabIndex === 1 && !store.scratchGui.mode.isPlayerOnly,
      });

      addon.tab.appendToSharedSpace({ space: "paintEditorModeSelector", element: panel, order: 1 });
      ui.renderSelector();
      ui.renderPalette();
      updateFloat();
    }
  };

  const attachVmListener = () => {
    if (!vm?.on) return;
    state.teardownVmTargetsListener?.();
    const handler = scheduleSync;
    vm.on("targetsUpdate", handler);
    state.teardownVmTargetsListener = () => {
      try {
        (vm.off || vm.removeListener)?.call(vm, "targetsUpdate", handler);
      } catch {}
      state.teardownVmTargetsListener = null;
    };
  };

  // Wrap renameCostume to update palette mappings when costumes are renamed
  const RenderedTarget = (vm.editingTarget || runtime.targets?.[0])?.constructor;
  if (RenderedTarget?.prototype.renameCostume) {
    const original = RenderedTarget.prototype.renameCostume;
    RenderedTarget.prototype.renameCostume = function (costumeIndex, newName) {
      const oldName = this.getCostumes()[costumeIndex]?.name;
      original.call(this, costumeIndex, newName);
      if (addon.self.disabled) return;
      storage.renameCostumeMapping(this, oldName, this.getCostumes()[costumeIndex]?.name);
    };
  }

  addon.self.addEventListener("disabled", () => state.teardownVmTargetsListener?.());
  addon.self.addEventListener("reenabled", () => {
    attachVmListener();
    scheduleSync();
  });

  attachVmListener();
  scheduleSync();

  return {
    updatePaletteSelection: ui.updatePaletteSelection,
    renderPalette: ui.renderPalette,
    addPaletteColor: ui.addPaletteColor,
    setupPalettePanel,
    updatePaletteColorFromFill: ui.updatePaletteColorFromFill,
  };
}
