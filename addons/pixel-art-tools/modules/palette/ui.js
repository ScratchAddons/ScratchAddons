import { createElement as el } from "../create-element.js";
import { createExportGPL, parseGPL, parseTXT, parseImage } from "./import-export.js";
import { sanitizeHex } from "./normalize-color.js";
import { createPaletteHistory } from "./history.js";

const PALETTE_LIMIT = 64;

/** @typedef {import("../types.js").PixelArtState} PixelArtState */

/**
 * @param {PixelArtState} state
 */
export function createUIModule(addon, state, redux, msg, console) {
  let storage;
  const setStorage = (storageModule) => {
    storage = storageModule;
  };

  const history = createPaletteHistory(
    addon,
    state,
    redux,
    (paletteId, colors) => {
      const palette = state.projectPalettes.find((p) => p.id === paletteId);
      // Deleting a whole palette is outside swatch undo history.
      if (!palette) return;
      palette.colors = colors.slice();
      Object.assign(state, {
        selectedPaletteId: paletteId,
        palette: palette.colors,
        editingPaletteIndex: -1,
        selectedPaletteIndex: -1,
      });
      renderSelector();
      renderPalette();
      updatePaletteSelection();
      storage.writeProjectComment(state.projectPalettes);
      storage.writeCostumePaletteId(paletteId);
    },
    () => addPaletteColor({ silent: true })
  );

  // Editable bitmap shapes and text supply RGB colors through Scratch's selection
  // reducer. This listener also receives the mixed-color sentinel in vector mode.
  const normalizeFillColor = (value) => {
    if (value === null || value === "scratch-paint/style-path/mixed") return null;
    const color = tinycolor(value);
    return color.isValid() ? color.toHexString().toUpperCase() : null;
  };

  const setFillHex = (hex) => {
    const normalized = sanitizeHex(hex);
    if (!normalized) return;
    redux.dispatch({ type: "scratch-paint/fill-style/CHANGE_FILL_COLOR", color: normalized });
    redux.dispatch({ type: "scratch-paint/fill-style/CHANGE_FILL_GRADIENT_TYPE", gradientType: "SOLID" });
  };

  const updatePaletteSelection = (hex = redux.state.scratchPaint.color.fillColor.primary) => {
    const target = normalizeFillColor(hex);
    const selectedIndex = target ? state.palette.findIndex((c) => c === target) : -1;
    state.selectedPaletteIndex = selectedIndex;
    state.paletteGrid?.querySelectorAll(".sa-pixel-art-color[data-index]").forEach((button) => {
      button.dataset.selected = String(button.dataset.index === String(selectedIndex));
    });
  };

  const showPaletteMessage = (message, type = "info") => {
    if (!state.paletteMessage) return;
    Object.assign(state.paletteMessage, {
      textContent: message,
      className: `sa-pixel-art-palette-message sa-pixel-art-palette-message-${type}`,
    });
    state.paletteMessage.style.display = "block";
    setTimeout(() => (state.paletteMessage.style.display = "none"), 3000);
  };

  const renderSelector = () => {
    if (!state.paletteDropdown) return;
    state.paletteDropdown.replaceChildren();

    const placeholder = el("option", {
      value: "",
      disabled: true,
      hidden: !!state.selectedPaletteId,
      selected: !state.selectedPaletteId,
      textContent: msg("paletteSelectPlaceholder"),
    });
    state.paletteDropdown.appendChild(placeholder);

    state.projectPalettes.forEach((palette) => {
      const option = el("option", {
        value: palette.id,
        textContent: palette.name,
        selected: palette.id === state.selectedPaletteId,
      });
      state.paletteDropdown.appendChild(option);
    });

    const createOption = el("option", {
      value: "__create__",
      textContent: msg("paletteCreateNew"),
    });
    state.paletteDropdown.appendChild(createOption);
  };

  const renderPalette = () => {
    if (!state.paletteGrid) return;
    state.paletteGrid.replaceChildren();
    const palette = state.projectPalettes.find((p) => p.id === state.selectedPaletteId);
    const colors = palette?.colors || [];

    colors.forEach((color, index) => {
      const button = el("button", {
        type: "button",
        className: "sa-pixel-art-color",
        title: color,
      });
      Object.assign(button.style, { backgroundColor: color });
      Object.assign(button.dataset, {
        index,
        color,
        selected: index === state.selectedPaletteIndex,
        editing: index === state.editingPaletteIndex,
      });

      button.onclick = (e) => {
        history.endEdit();
        if (e.shiftKey) {
          state.editingPaletteIndex = state.editingPaletteIndex === index ? -1 : index;
          state.paletteGrid
            .querySelectorAll(".sa-pixel-art-color[data-index]")
            .forEach((btn) => (btn.dataset.editing = btn.dataset.index === String(state.editingPaletteIndex)));
        }
        setFillHex(color);
        updatePaletteSelection(color);
      };

      button.oncontextmenu = (e) => {
        e.preventDefault();
        const before = palette.colors.slice();
        palette.colors.splice(index, 1);
        history.record(palette, before);
        state.editingPaletteIndex = state.selectedPaletteIndex = -1;
        renderPalette();
        updatePaletteSelection();
        storage.writeProjectComment(state.projectPalettes);
        storage.writeCostumePaletteId(state.selectedPaletteId);
      };

      state.paletteGrid.appendChild(button);
    });

    const addButton = el("button", {
      type: "button",
      className: "sa-pixel-art-color sa-pixel-art-color-add",
    });
    addButton.setAttribute("aria-label", msg("addColor"));
    addButton.onclick = () => addPaletteColor();
    state.paletteGrid.appendChild(addButton);

    if (state.paletteNotice) state.paletteNotice.hidden = colors.length > 0;
  };

  const addPaletteColor = ({ silent = false } = {}) => {
    const palette = state.projectPalettes.find((p) => p.id === state.selectedPaletteId);
    const normalized = normalizeFillColor(redux.state.scratchPaint.color.fillColor.primary);
    if (!normalized) {
      if (!silent) showPaletteMessage(msg("selectColorToAdd"), "info");
      return;
    }

    if (palette.colors.includes(normalized)) {
      if (!silent) showPaletteMessage(msg("colorAlreadyExists"), "info");
      updatePaletteSelection(normalized);
      return;
    }

    if (palette.colors.length >= PALETTE_LIMIT) {
      if (!silent) showPaletteMessage(msg("paletteFull"), "warning");
      return;
    }

    const before = palette.colors.slice();
    palette.colors.push(normalized);
    history.record(palette, before, { drawing: silent });
    state.selectedPaletteIndex = palette.colors.length - 1;
    renderPalette();
    updatePaletteSelection(normalized);
    storage.writeProjectComment(state.projectPalettes);
    storage.writeCostumePaletteId(state.selectedPaletteId);
  };

  const updatePaletteColorFromFill = (newHex) => {
    const palette = state.projectPalettes.find((p) => p.id === state.selectedPaletteId);
    const normalized = normalizeFillColor(newHex);
    if (!normalized) return;
    if (palette.colors[state.editingPaletteIndex] === normalized) return;

    if (palette.colors.includes(normalized)) {
      showPaletteMessage(msg("colorAlreadyExists"), "info");
      return;
    }

    const before = palette.colors.slice();
    palette.colors[state.editingPaletteIndex] = normalized;
    history.record(palette, before, { editing: true });
    renderPalette();
    updatePaletteSelection(normalized);
    storage.writeProjectComment(state.projectPalettes);
    storage.writeCostumePaletteId(state.selectedPaletteId);
  };

  const createImportInput = () => {
    const importInput = el("input", {
      type: "file",
      accept: ".gpl,.txt,.png,.jpg,.jpeg,.gif,.bmp",
      className: "sa-pixel-art-hidden",
    });
    importInput.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        let parsed = [];

        if (file.type.startsWith("image/")) {
          parsed = await parseImage(file);
        } else {
          const reader = new FileReader();
          const text = await new Promise((resolve, reject) => {
            reader.onload = () => resolve(String(reader.result));
            reader.onerror = reject;
            reader.readAsText(file);
          });

          if (file.name.toLowerCase().endsWith(".gpl")) {
            parsed = parseGPL(text);
          } else if (file.name.toLowerCase().endsWith(".txt")) {
            parsed = parseTXT(text);
          }
        }

        if (parsed.length) {
          const baseName = file.name.replace(/\.[^.]+$/, "");
          const newPalette = {
            id: `pal-${storage.randomId()}`,
            name: baseName || `${msg("paletteTitle")} ${state.projectPalettes.length + 1}`,
            colors: parsed.slice(0, PALETTE_LIMIT),
          };
          state.projectPalettes.push(newPalette);
          state.selectedPaletteId = newPalette.id;
          state.palette = newPalette.colors;
          state.editingPaletteIndex = -1;
          state.selectedPaletteIndex = -1;
          renderSelector();
          renderPalette();
          updatePaletteSelection();
          storage.writeProjectComment(state.projectPalettes);
          storage.writeCostumePaletteId(state.selectedPaletteId);
        }
      } catch (err) {
        console.error("Palette import failed", err);
        showPaletteMessage(msg("importFailed"), "warning");
      }

      importInput.value = "";
    };
    return importInput;
  };

  const createActionButtons = (handleDeletePalette) => {
    const makeActionBtn = (icon, label, extraClass) => {
      const btn = el("button", {
        type: "button",
        className: `sa-pixel-art-action-button${extraClass ? " " + extraClass : ""}`,
        title: label,
      });
      btn.setAttribute("aria-label", label);
      const img = el("img", {
        src: `${addon.self.dir}/icons/${icon}`,
        alt: "",
        className: "sa-pixel-art-icon",
      });
      btn.appendChild(img);
      return btn;
    };

    const importInput = createImportInput();
    const importBtn = makeActionBtn("import.svg", msg("importPalette"));
    importBtn.onclick = () => importInput.click();

    const exportBtn = makeActionBtn("export.svg", msg("exportPalette"));
    exportBtn.onclick = createExportGPL(state);

    const deleteBtn = makeActionBtn("delete.svg", msg("deletePalette"), "sa-pixel-art-action-button--danger");
    deleteBtn.onclick = handleDeletePalette;

    return { importInput, importBtn, exportBtn, deleteBtn };
  };

  return {
    setStorage,
    updatePaletteSelection,
    renderPalette,
    renderSelector,
    updatePaletteColorFromFill,
    showPaletteMessage,
    createImportInput,
    createActionButtons,
  };
}
