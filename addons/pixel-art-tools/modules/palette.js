const PALETTE_LIMIT = 64;

export function createPaletteModule(addon, state, redux, msg) {
  const sanitizeHex = (value) => {
    if (!value) return null;
    if (typeof value !== "string") return null;
    const trimmed = value.trim().replace(/^#/, "");
    if (!/^([0-9a-f]{6})$/i.test(trimmed)) return null;
    return `#${trimmed.toUpperCase()}`;
  };

  const getFillHex = () => {
    try {
      const fill = redux.state?.scratchPaint?.color?.fillColor;
      const primary = fill?.primary;
      return sanitizeHex(primary);
    } catch (e) {
      console.error("pixel-art-tools: failed to read fill color", e);
      return null;
    }
  };

  const setFillHex = (hex) => {
    const normalized = sanitizeHex(hex);
    if (!normalized) return;
    redux.dispatch({
      type: "scratch-paint/fill-style/CHANGE_FILL_COLOR",
      color: normalized,
    });
    redux.dispatch({
      type: "scratch-paint/fill-style/CHANGE_FILL_GRADIENT_TYPE",
      gradientType: "SOLID",
    });
  };

  const updatePaletteSelection = (hex) => {
    const target = sanitizeHex(hex || getFillHex());
    let selectedIndex = -1;
    if (target) {
      selectedIndex = state.palette.findIndex((entry) => entry === target);
    }
    state.selectedPaletteIndex = selectedIndex;
    if (state.paletteGrid) {
      [...state.paletteGrid.querySelectorAll(".sa-pixel-art-color")].forEach((button, index) => {
        button.dataset.selected = index === selectedIndex ? "true" : "false";
        // Don't clear editing state here - let explicit actions control it
      });
    }
  };

  const toggleEditingPaletteColor = (index) => {
    if (state.editingPaletteIndex === index) {
      // Already editing this color, exit edit mode
      state.editingPaletteIndex = -1;
    } else {
      // Start editing this color
      state.editingPaletteIndex = index;
    }

    if (state.paletteGrid) {
      [...state.paletteGrid.querySelectorAll(".sa-pixel-art-color")].forEach((button, buttonIndex) => {
        button.dataset.editing = buttonIndex === state.editingPaletteIndex ? "true" : "false";
      });
    }
  };

  const updatePaletteColorFromFill = (newHex) => {
    if (state.editingPaletteIndex >= 0 && state.editingPaletteIndex < state.palette.length) {
      const normalized = sanitizeHex(newHex);
      if (normalized) {
        state.palette[state.editingPaletteIndex] = normalized;
        renderPalette();
      }
    }
  };

  const showPaletteMessage = (message, type = "info") => {
    if (state.paletteMessage) {
      state.paletteMessage.textContent = message;
      state.paletteMessage.className = `sa-pixel-art-palette-message sa-pixel-art-palette-message-${type}`;
      state.paletteMessage.style.display = "block";

      // Auto-hide after 3 seconds
      setTimeout(() => {
        if (state.paletteMessage) {
          state.paletteMessage.style.display = "none";
        }
      }, 3000);
    }
  };

  const renderPalette = () => {
    if (!state.paletteGrid) return;
    state.paletteGrid.innerHTML = "";
    state.palette.forEach((color, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "sa-pixel-art-color";
      button.style.backgroundColor = color;
      button.title = color;
      button.dataset.index = String(index);
      if (index === state.selectedPaletteIndex) {
        button.dataset.selected = "true";
      }
      if (index === state.editingPaletteIndex) {
        button.dataset.editing = "true";
      }
      button.addEventListener("click", (event) => {
        if (event.shiftKey) {
          // Shift+click to toggle edit mode
          toggleEditingPaletteColor(index);
          setFillHex(color); // Set fill to current color
        } else {
          // Normal click to select/apply the color (doesn't exit edit mode)
          setFillHex(color);
          updatePaletteSelection(color);
        }
      });
      button.addEventListener("contextmenu", (event) => {
        event.preventDefault();
        state.palette.splice(index, 1);
        updatePaletteSelection();
        renderPalette();
      });
      state.paletteGrid.appendChild(button);
    });
    if (state.palette.length === 0 && state.paletteNotice) {
      state.paletteNotice.hidden = false;
    } else if (state.paletteNotice) {
      state.paletteNotice.hidden = true;
    }
  };

  const addPaletteColor = (hex) => {
    const normalized = sanitizeHex(hex || getFillHex());
    if (!normalized) return;

    if (state.palette.includes(normalized)) {
      showPaletteMessage(msg("colorAlreadyExists"), "info");
      updatePaletteSelection(normalized);
      return;
    }

    if (state.palette.length >= PALETTE_LIMIT) {
      showPaletteMessage(msg("paletteFull"), "warning");
      return;
    }

    state.palette.push(normalized);
    updatePaletteSelection(normalized);
    renderPalette();
  };

  const parseGPL = (text) => {
    const lines = text.split(/\r?\n/);
    const colors = [];
    for (const line of lines) {
      if (!line || line.startsWith("#")) continue;
      if (!/\d/.test(line)) continue;
      const parts = line.trim().split(/\s+/);
      if (parts.length < 3) continue;
      const [r, g, b] = parts.slice(0, 3).map((p) => Number.parseInt(p, 10));
      if ([r, g, b].some((v) => Number.isNaN(v))) continue;
      const hex = `#${[r, g, b]
        .map((value) => Math.max(0, Math.min(255, value)).toString(16).toUpperCase().padStart(2, "0"))
        .join("")}`;
      colors.push(hex);
    }
    return colors;
  };

  const exportGPL = () => {
    if (state.palette.length === 0) return;
    const header = [
      "GIMP Palette",
      `# ${msg("paletteExportLabel")}`,
      "Name: Scratch Addons Pixel Palette",
      "Columns: 0",
      "#",
    ].join("\n");
    const body = state.palette
      .map((hex) => {
        const r = Number.parseInt(hex.slice(1, 3), 16);
        const g = Number.parseInt(hex.slice(3, 5), 16);
        const b = Number.parseInt(hex.slice(5, 7), 16);
        return `${r}\t${g}\t${b}\t${hex}`;
      })
      .join("\n");
    const blob = new Blob([`${header}\n${body}\n`], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const downloadLink = document.createElement("a");
    downloadLink.href = url;
    downloadLink.download = "pixel-palette.gpl";
    document.body.appendChild(downloadLink);
    downloadLink.click();
    setTimeout(() => {
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(url);
    }, 100);
  };

  const createPalettePanel = () => {
    const panel = document.createElement("section");
    panel.className = "sa-pixel-art-palette";
    panel.style.display = "none"; // Initially hidden

    const header = document.createElement("header");
    header.className = "sa-pixel-art-palette-header";
    header.textContent = msg("paletteTitle");
    panel.appendChild(header);

    const actions = document.createElement("div");
    actions.className = "sa-pixel-art-palette-actions";

    const addBtn = document.createElement("button");
    addBtn.type = "button";
    addBtn.className = "sa-pixel-art-icon-button";
    addBtn.setAttribute("aria-label", msg("addColor"));
    addBtn.textContent = "+";
    addBtn.addEventListener("click", () => addPaletteColor());
    actions.appendChild(addBtn);

    const importInput = document.createElement("input");
    importInput.type = "file";
    importInput.accept = ".gpl";
    importInput.className = "sa-pixel-art-hidden";
    importInput.addEventListener("change", (event) => {
      const file = event.target.files && event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        try {
          const parsed = parseGPL(String(reader.result));
          if (parsed.length) {
            state.palette = parsed.slice(0, PALETTE_LIMIT);
            updatePaletteSelection();
            renderPalette();
          }
        } catch (e) {
          console.error("pixel-art-tools: failed to import palette", e);
        }
      });
      reader.readAsText(file);
      importInput.value = "";
    });

    const importBtn = document.createElement("button");
    importBtn.type = "button";
    importBtn.className = "sa-pixel-art-icon-button";
    importBtn.textContent = msg("importPalette");
    importBtn.addEventListener("click", () => importInput.click());
    actions.appendChild(importBtn);

    const exportBtn = document.createElement("button");
    exportBtn.type = "button";
    exportBtn.className = "sa-pixel-art-icon-button";
    exportBtn.textContent = msg("exportPalette");
    exportBtn.addEventListener("click", exportGPL);
    actions.appendChild(exportBtn);

    panel.appendChild(actions);
    panel.appendChild(importInput);

    const notice = document.createElement("p");
    notice.className = "sa-pixel-art-palette-empty";
    notice.textContent = msg("emptyPalette");
    panel.appendChild(notice);
    state.paletteNotice = notice;

    const grid = document.createElement("div");
    grid.className = "sa-pixel-art-palette-grid";
    panel.appendChild(grid);
    state.paletteGrid = grid;

    const messageArea = document.createElement("div");
    messageArea.className = "sa-pixel-art-palette-message";
    messageArea.style.display = "none";
    panel.appendChild(messageArea);
    state.paletteMessage = messageArea;

    return panel;
  };

  const setupPalettePanel = async () => {
    const panel = createPalettePanel();
    state.palettePanel = panel;

    while (true) {
      // Wait for paint editor to be ready, re-running on Redux events
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

      // Use shared space API
      addon.tab.appendToSharedSpace({
        space: "paintEditorModeSelector",
        element: panel,
        order: 1,
      });

      renderPalette();
    }
  };

  return {
    updatePaletteSelection,
    renderPalette,
    addPaletteColor,
    setupPalettePanel,
    updatePaletteColorFromFill,
  };
}
