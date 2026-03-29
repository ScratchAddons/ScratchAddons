import { createStorageModule } from "./storage.js";
import { createUIModule } from "./ui.js";
import { createImportExportModule } from "./import-export.js";
import { bindFloatingPanel } from "../floating-panel.js";

export function createPaletteModule(addon, state, redux, msg) {
  const vm = addon.tab.traps.vm;
  const runtime = vm.runtime;

  const el = (tag, props = {}, children = []) => {
    const e = Object.assign(document.createElement(tag), props);
    children.forEach((c) => (typeof c === "string" ? (e.textContent = c) : e.appendChild(c)));
    return e;
  };

  Object.assign(state, {
    projectPalettes: state.projectPalettes || [],
    selectedPaletteId: state.selectedPaletteId || null,
    paletteDropdown: null,
    teardownVmTargetsListener: null,
  });

  let resolvePalettePanelReady;
  state.palettePanelReady = state.palettePanelReady || new Promise((resolve) => (resolvePalettePanelReady = resolve));

  const ui = createUIModule(addon, state, redux, msg, null, null);
  const storage = createStorageModule(addon, vm, runtime, msg, state, ui);
  const importExport = createImportExportModule(state);
  ui.setDependencies(storage, importExport);

  const createPalette = (name) => ({
    id: `pal-${storage.randomId()}`,
    name: name || `${msg("paletteTitle") || "Palette"} ${state.projectPalettes.length + 1}`,
    colors: [],
  });

  const ensureActivePalette = () => {
    if (!state.projectPalettes.length) {
      const p = createPalette();
      state.projectPalettes.push(p);
      state.selectedPaletteId = p.id;
      state.palette = p.colors;
    }
    if (!state.selectedPaletteId) {
      state.selectedPaletteId = state.projectPalettes[0].id;
      state.palette = state.projectPalettes[0].colors;
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
    const currentId = state.selectedPaletteId;
    const loaded = storage.loadProjectPalettes();
    if (loaded.length) state.projectPalettes = loaded;
    ensureActivePalette();
    const paletteId = storage.readCostumePaletteId();
    const findId = (id) => state.projectPalettes.some((p) => p.id === id);
    setActivePalette(
      findId(paletteId) ? paletteId : findId(currentId) ? currentId : state.projectPalettes[0].id,
      !findId(paletteId) && !findId(currentId)
    );
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
    const panel = el("section", { className: "sa-pixel-art-palette" });
    panel.style.display = "none";
    addon.tab.displayNoneWhileDisabled(panel);

    // Header (draggable when floating)
    const header = el("header", { className: "sa-pixel-art-palette-header" }, [msg("paletteTitle")]);
    panel.appendChild(header);

    // Float when narrow viewport
    const updateFloat = () => {
      const canvas = document.querySelector("[class*='paper-canvas_paper-canvas']");
      if (window.innerWidth < 1256 && canvas) {
        panel.dataset.floating = "true";
        canvas.parentElement.appendChild(panel);
        Object.assign(panel.style, { right: "10px", top: "10px", left: "auto" });
      } else {
        delete panel.dataset.floating;
        Object.assign(panel.style, { left: "", top: "", right: "" });
        document.querySelector("[class*='paint-editor_mode-selector']")?.appendChild(panel);
      }
    };
    bindFloatingPanel(addon, panel, header, updateFloat);

    // Dropdown selector
    const dropdown = el("select", { className: "sa-pixel-art-palette-select" });
    dropdown.onchange = (e) => {
      if (e.target.value === "__create__") {
        const p = createPalette();
        state.projectPalettes.push(p);
        setActivePalette(p.id);
        storage.writeProjectComment(state.projectPalettes);
      } else if (e.target.value) setActivePalette(e.target.value);
    };
    panel.appendChild(el("div", { className: "sa-pixel-art-palette-select-row" }, [dropdown]));
    state.paletteDropdown = dropdown;

    // Notice, grid, message
    const notice = el("p", { className: "sa-pixel-art-palette-empty" }, [msg("emptyPalette")]);
    const grid = el("div", { className: "sa-pixel-art-palette-grid" });
    const messageArea = el("div", { className: "sa-pixel-art-palette-message" });
    messageArea.style.display = "none";
    panel.append(notice, grid, messageArea);
    Object.assign(state, { paletteNotice: notice, paletteGrid: grid, paletteMessage: messageArea });

    // Actions
    const { importInput, importBtn, exportBtn, deleteBtn } = ui.createActionButtons(storage.handleDeletePalette);
    panel.appendChild(importInput);
    panel.appendChild(el("div", { className: "sa-pixel-art-palette-actions" }, [importBtn, exportBtn, deleteBtn]));

    state.palettePanel = panel;
    if (resolvePalettePanelReady) {
      resolvePalettePanelReady(panel);
      resolvePalettePanelReady = null;
    }

    while (true) {
      if (addon.self.disabled) {
        await new Promise((resolve) => addon.self.addEventListener("reenabled", resolve, { once: true }));
      }
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
    state.teardownVmTargetsListener?.();
    const handler = scheduleSync;
    vm.on("targetsUpdate", handler);
    state.teardownVmTargetsListener = () => {
      vm.removeListener("targetsUpdate", handler);
      state.teardownVmTargetsListener = null;
    };
  };

  // Update palette mappings when costumes are renamed
  const RenderedTarget = (vm.editingTarget || runtime.targets?.[0])?.constructor;
  if (RenderedTarget?.prototype.renameCostume) {
    const original = RenderedTarget.prototype.renameCostume;
    RenderedTarget.prototype.renameCostume = function (costumeIndex, newName) {
      const oldName = this.getCostumes()[costumeIndex]?.name;
      original.call(this, costumeIndex, newName);
      if (!addon.self.disabled) storage.renameCostumeMapping(this, oldName, this.getCostumes()[costumeIndex]?.name);
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
