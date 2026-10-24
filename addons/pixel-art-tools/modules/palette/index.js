import { createStorageModule } from "./storage.js";
import { createUIModule } from "./ui.js";
import { bindFloatingPanel } from "../floating-panel.js";
import { createElement as el } from "../create-element.js";

/** @typedef {import("../types.js").PixelArtPalette} PixelArtPalette */
/** @typedef {import("../types.js").PixelArtState} PixelArtState */

/**
 * @param {PixelArtState} state
 */
export function createPaletteModule(addon, state, redux, msg, console) {
  const vm = addon.tab.traps.vm;
  const runtime = vm.runtime;

  let resolvePalettePanelReady;
  state.palettePanelReady = new Promise((resolve) => (resolvePalettePanelReady = resolve));

  const ui = createUIModule(addon, state, redux, msg, console);
  const storage = createStorageModule(addon, vm, runtime, msg, state, ui);
  ui.setStorage(storage);

  /** @returns {PixelArtPalette} */
  const createPalette = (name) => ({
    id: `pal-${storage.randomId()}`,
    name: name || `${msg("paletteTitle")} ${state.projectPalettes.length + 1}`,
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

  const isCostumeEditorActive = () =>
    !addon.self.disabled &&
    redux.state.scratchGui?.editorTab?.activeTabIndex === 1 &&
    !redux.state.scratchGui?.mode?.isPlayerOnly;
  let lastTarget = null;
  let lastCostumeName = null;
  let lastStage = null;
  const getCostumeName = () => vm.editingTarget?.sprite?.costumes?.[vm.editingTarget.currentCostume]?.name;

  const syncPalette = () => {
    if (!isCostumeEditorActive()) return;
    const stage = runtime.getTargetForStage();
    if (!stage || !vm.editingTarget) return;
    const costumeName = getCostumeName();
    const contextChanged = vm.editingTarget !== lastTarget || costumeName !== lastCostumeName;
    const currentId = state.selectedPaletteId;
    const loaded = storage.loadProjectPalettes();
    const palettesChanged =
      (loaded.length > 0 || stage !== lastStage) && JSON.stringify(loaded) !== JSON.stringify(state.projectPalettes);
    if (palettesChanged) state.projectPalettes = loaded;
    ensureActivePalette();
    const paletteId = storage.readCostumePaletteId();
    const findId = (id) => state.projectPalettes.some((p) => p.id === id);
    const selectedId = findId(paletteId) ? paletteId : findId(currentId) ? currentId : state.projectPalettes[0].id;
    lastTarget = vm.editingTarget;
    lastCostumeName = costumeName;
    lastStage = stage;
    // Our own palette writes also emit PROJECT_CHANGED. Keep the existing DOM
    // and swatch edit when the stored data already matches the current palette.
    if (contextChanged || palettesChanged || selectedId !== state.selectedPaletteId) {
      setActivePalette(selectedId, !findId(paletteId) && !findId(currentId));
    }
  };

  let syncPending = false;
  const scheduleSync = () => {
    if (syncPending || !isCostumeEditorActive()) return;
    syncPending = true;
    queueMicrotask(() => {
      syncPending = false;
      syncPalette();
    });
  };

  const setupPalettePanel = async () => {
    const panel = el("section", { className: "sa-pixel-art-palette sa-pixel-art-hidden" });
    addon.tab.displayNoneWhileDisabled(panel);

    // Header (draggable when floating)
    const header = el("header", { className: "sa-pixel-art-palette-header" }, [msg("paletteTitle")]);
    panel.appendChild(header);

    // Float when narrow viewport
    const updateFloat = () => {
      const canvas = document.querySelector("[class*='paper-canvas_paper-canvas']");
      // Tuned manually as the point where the mode selector area gets too tight
      // to keep the palette docked comfortably.
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
      // Scratch remounts this part of the costume editor frequently when switching
      // tabs/targets/formats, so the palette has to keep reattaching itself.
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

  const onTargetsUpdate = () => {
    // Sprite movement emits this event too. Palette mappings only depend on
    // the editing target and costume name, not position or bitmap encoding.
    if (!isCostumeEditorActive()) return;
    if (vm.editingTarget !== lastTarget || getCostumeName() !== lastCostumeName) scheduleSync();
  };

  const attachVmListeners = () => {
    state.teardownVmListeners?.();
    vm.on("targetsUpdate", onTargetsUpdate);
    vm.on("PROJECT_CHANGED", scheduleSync);
    vm.on("PROJECT_LOADED", scheduleSync);
    state.teardownVmListeners = () => {
      vm.removeListener("targetsUpdate", onTargetsUpdate);
      vm.removeListener("PROJECT_CHANGED", scheduleSync);
      vm.removeListener("PROJECT_LOADED", scheduleSync);
      state.teardownVmListeners = null;
    };
  };

  redux.addEventListener("statechanged", ({ detail: { action } }) => {
    if (action.type === "scratch-gui/navigation/ACTIVATE_TAB" || action.type === "scratch-gui/mode/SET_PLAYER") {
      scheduleSync();
    }
  });

  // Update palette mappings when costumes are renamed
  const installRenameHook = () => {
    const targetPrototype = runtime.getTargetForStage().constructor.prototype;
    const original = targetPrototype.renameCostume;
    targetPrototype.renameCostume = function (costumeIndex, newName) {
      const oldName = this.getCostumes()[costumeIndex]?.name;
      original.call(this, costumeIndex, newName);
      if (!addon.self.disabled) storage.renameCostumeMapping(this, oldName, this.getCostumes()[costumeIndex]?.name);
    };
  };
  if (runtime.getTargetForStage()) installRenameHook();
  else runtime.once("PROJECT_LOADED", installRenameHook);

  addon.self.addEventListener("disabled", () => state.teardownVmListeners?.());
  addon.self.addEventListener("reenabled", () => {
    attachVmListeners();
    scheduleSync();
  });
  attachVmListeners();
  scheduleSync();

  return {
    updatePaletteSelection: ui.updatePaletteSelection,
    renderPalette: ui.renderPalette,
    setupPalettePanel,
    updatePaletteColorFromFill: ui.updatePaletteColorFromFill,
  };
}
