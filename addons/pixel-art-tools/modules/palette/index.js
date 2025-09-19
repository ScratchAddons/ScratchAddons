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
    teardownVmTargetsListener: null
  });

  const storage = createStorageModule(addon, vm, runtime, msg, state);
  const importExport = createImportExportModule(state, storage);
  const ui = createUIModule(addon, state, redux, msg, storage, importExport);

  const createPalette = (name) => ({
    id: `pal-${storage.randomId()}`,
    name: name || `${msg("paletteTitle") || "Palette"} ${state.projectPalettes.length + 1}`,
    colors: []
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
    const palette = state.projectPalettes.find(p => p.id === paletteId);
    if (!palette) return;
    Object.assign(state, {
      selectedPaletteId: paletteId,
      palette: palette.colors,
      editingPaletteIndex: -1,
      selectedPaletteIndex: -1
    });
    ui.renderSelector();
    ui.renderPalette();
    ui.updatePaletteSelection();
    if (persistCostume) storage.writeCostumePaletteId(paletteId);
  };

  const syncPalette = () => {
    const loaded = storage.loadProjectPalettes();
    if (loaded.length) state.projectPalettes = loaded;
    ensureActivePalette();

    const paletteId = storage.readCostumePaletteId();
    if (paletteId && state.projectPalettes.some(p => p.id === paletteId)) {
      setActivePalette(paletteId, false);
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

    const header = Object.assign(document.createElement("header"), {
      className: "sa-pixel-art-palette-header", textContent: msg("paletteTitle")
    });
    panel.appendChild(header);

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
      className: "sa-pixel-art-palette-empty", textContent: msg("emptyPalette")
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
        reduxEvents: ["scratch-gui/navigation/ACTIVATE_TAB", "scratch-gui/targets/UPDATE_TARGET_LIST", "scratch-paint/formats/CHANGE_FORMAT"],
        reduxCondition: (store) => store.scratchGui.editorTab.activeTabIndex === 1 && !store.scratchGui.mode.isPlayerOnly,
      });

      addon.tab.appendToSharedSpace({ space: "paintEditorModeSelector", element: panel, order: 1 });
      ui.renderSelector();
      ui.renderPalette();
    }
  };

  const attachVmListener = () => {
    if (!vm?.on) return;
    state.teardownVmTargetsListener?.();
    const handler = scheduleSync;
    vm.on("targetsUpdate", handler);
    state.teardownVmTargetsListener = () => {
      (vm.off || vm.removeListener)?.("targetsUpdate", handler);
      state.teardownVmTargetsListener = null;
    };
  };

  addon.self.addEventListener("disabled", () => state.teardownVmTargetsListener?.());
  addon.self.addEventListener("reenabled", () => { attachVmListener(); scheduleSync(); });

  attachVmListener();
  scheduleSync();

  return { 
    updatePaletteSelection: ui.updatePaletteSelection, 
    renderPalette: ui.renderPalette, 
    addPaletteColor: ui.addPaletteColor, 
    setupPalettePanel, 
    updatePaletteColorFromFill: ui.updatePaletteColorFromFill 
  };
}