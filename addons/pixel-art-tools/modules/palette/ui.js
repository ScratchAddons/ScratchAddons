const PALETTE_LIMIT = 64;

export function createUIModule(addon, state, redux, msg, storage, importExport) {
  const sanitizeHex = (value) => {
    const trimmed = value?.toString().trim().replace(/^#/, "");
    return /^[0-9a-f]{6}$/i.test(trimmed) ? `#${trimmed.toUpperCase()}` : null;
  };

  const getFillHex = () => sanitizeHex(redux.state.scratchPaint?.color?.fillColor?.primary);

  const setFillHex = (hex) => {
    const normalized = sanitizeHex(hex);
    if (!normalized) return;
    redux.dispatch({ type: "scratch-paint/fill-style/CHANGE_FILL_COLOR", color: normalized });
    redux.dispatch({ type: "scratch-paint/fill-style/CHANGE_FILL_GRADIENT_TYPE", gradientType: "SOLID" });
  };

  const updatePaletteSelection = (hex) => {
    const target = sanitizeHex(hex || getFillHex());
    const selectedIndex = target ? state.palette.findIndex(c => c === target) : -1;
    state.selectedPaletteIndex = selectedIndex;
    state.paletteGrid?.querySelectorAll(".sa-pixel-art-color[data-index]").forEach(button => {
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
    setTimeout(() => state.paletteMessage.style.display = "none", 3000);
  };

  const renderSelector = () => {
    if (!state.paletteDropdown) return;
    state.paletteDropdown.innerHTML = "";
    
    const placeholder = Object.assign(document.createElement("option"), {
      value: "", disabled: true, hidden: !!state.selectedPaletteId, selected: !state.selectedPaletteId,
      textContent: msg("paletteSelectPlaceholder") || "Select a palette"
    });
    state.paletteDropdown.appendChild(placeholder);

    state.projectPalettes.forEach(palette => {
      const option = Object.assign(document.createElement("option"), {
        value: palette.id, textContent: palette.name, selected: palette.id === state.selectedPaletteId
      });
      state.paletteDropdown.appendChild(option);
    });

    const createOption = Object.assign(document.createElement("option"), {
      value: "__create__", textContent: msg("paletteCreateNew") || "Create new palette"
    });
    state.paletteDropdown.appendChild(createOption);
  };

  const renderPalette = () => {
    if (!state.paletteGrid) return;
    state.paletteGrid.innerHTML = "";
    const palette = state.projectPalettes.find(p => p.id === state.selectedPaletteId);
    const colors = palette?.colors || [];

    colors.forEach((color, index) => {
      const button = Object.assign(document.createElement("button"), {
        type: "button", className: "sa-pixel-art-color", title: color
      });
      Object.assign(button.style, { backgroundColor: color });
      Object.assign(button.dataset, {
        index, color,
        selected: index === state.selectedPaletteIndex,
        editing: index === state.editingPaletteIndex
      });
      
      button.onclick = (e) => {
        if (e.shiftKey) {
          state.editingPaletteIndex = state.editingPaletteIndex === index ? -1 : index;
          state.paletteGrid.querySelectorAll(".sa-pixel-art-color[data-index]").forEach(btn => 
            btn.dataset.editing = btn.dataset.index === String(state.editingPaletteIndex));
        }
        setFillHex(color);
        updatePaletteSelection(color);
      };
      
      button.oncontextmenu = (e) => {
        e.preventDefault();
        if (!palette) return;
        palette.colors.splice(index, 1);
        state.editingPaletteIndex = state.selectedPaletteIndex = -1;
        renderPalette();
        updatePaletteSelection();
        storage.writeProjectComment(state.projectPalettes);
        storage.writeCostumePaletteId(state.selectedPaletteId);
      };
      
      state.paletteGrid.appendChild(button);
    });

    const addButton = Object.assign(document.createElement("button"), {
      type: "button", className: "sa-pixel-art-color sa-pixel-art-color-add"
    });
    addButton.setAttribute("aria-label", msg("addColor"));
    addButton.onclick = () => addPaletteColor();
    state.paletteGrid.appendChild(addButton);

    if (state.paletteNotice) state.paletteNotice.hidden = colors.length > 0;
  };

  const addPaletteColor = (hex) => {
    const palette = state.projectPalettes.find(p => p.id === state.selectedPaletteId);
    const normalized = sanitizeHex(hex || getFillHex());
    if (!palette || !normalized) return;

    if (palette.colors.includes(normalized)) {
      showPaletteMessage(msg("colorAlreadyExists") || "Color already exists", "info");
      updatePaletteSelection(normalized);
      return;
    }

    if (palette.colors.length >= PALETTE_LIMIT) {
      showPaletteMessage(msg("paletteFull"), "warning");
      return;
    }

    palette.colors.push(normalized);
    state.selectedPaletteIndex = palette.colors.length - 1;
    renderPalette();
    updatePaletteSelection(normalized);
    storage.writeProjectComment(state.projectPalettes);
    storage.writeCostumePaletteId(state.selectedPaletteId);
  };

  const updatePaletteColorFromFill = (newHex) => {
    const palette = state.projectPalettes.find(p => p.id === state.selectedPaletteId);
    const normalized = sanitizeHex(newHex);
    if (!palette || state.editingPaletteIndex < 0 || !normalized) return;
    
    if (palette.colors.includes(normalized)) {
      showPaletteMessage(msg("colorAlreadyExists") || "Color already exists", "info");
      return;
    }
    
    palette.colors[state.editingPaletteIndex] = normalized;
    renderPalette();
    updatePaletteSelection(normalized);
    storage.writeProjectComment(state.projectPalettes);
    storage.writeCostumePaletteId(state.selectedPaletteId);
  };

  const createImportInput = () => {
    const importInput = Object.assign(document.createElement("input"), {
      type: "file", accept: ".gpl,.txt,.png,.jpg,.jpeg,.gif,.bmp", className: "sa-pixel-art-hidden"
    });
    importInput.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      const p = state.projectPalettes.find(p => p.id === state.selectedPaletteId);
      if (!p) return;
      
      try {
        let parsed = [];
        
        if (file.type.startsWith("image/")) {
          // Handle image files
          parsed = await importExport.parseImage(file);
        } else {
          // Handle text files (.gpl, .txt)
          const reader = new FileReader();
          const text = await new Promise((resolve, reject) => {
            reader.onload = () => resolve(String(reader.result));
            reader.onerror = reject;
            reader.readAsText(file);
          });
          
          if (file.name.toLowerCase().endsWith(".gpl")) {
            parsed = importExport.parseGPL(text);
          } else if (file.name.toLowerCase().endsWith(".txt")) {
            parsed = importExport.parseTXT(text);
          }
        }
        
        if (parsed.length) {
          p.colors.length = 0;
          p.colors.push(...parsed.slice(0, PALETTE_LIMIT));
          renderPalette();
          updatePaletteSelection();
          storage.writeProjectComment(state.projectPalettes);
          storage.writeCostumePaletteId(state.selectedPaletteId);
        }
      } catch (err) {
        console.error("pixel-art-tools: import failed", err);
        showPaletteMessage("Import failed", "warning");
      }
      
      importInput.value = "";
    };
    return importInput;
  };

  const createActionButtons = (handleDeletePalette) => {
    const makeActionBtn = (icon, label, extraClass) => {
      const btn = Object.assign(document.createElement("button"), {
        type: "button",
        className: `sa-pixel-art-action-button${extraClass ? " " + extraClass : ""}`,
        title: label
      });
      btn.setAttribute("aria-label", label);
      const img = Object.assign(document.createElement("img"), {
        src: `${addon.self.dir}/icons/${icon}`,
        alt: "",
        className: "sa-pixel-art-icon" + (icon === "export.svg" ? " sa-pixel-art-icon--invert" : "")
      });
      btn.appendChild(img);
      return btn;
    };

    const importInput = createImportInput();
    const importBtn = makeActionBtn("import.svg", msg("importPalette"));
    importBtn.onclick = () => importInput.click();
    
    const exportBtn = makeActionBtn("export.svg", msg("exportPalette"));
    exportBtn.onclick = importExport.exportGPL;
    
    const deleteBtn = makeActionBtn("delete.svg", msg("deletePalette"), "sa-pixel-art-action-button--danger");
    deleteBtn.onclick = handleDeletePalette;

    return { importInput, importBtn, exportBtn, deleteBtn };
  };

  return {
    updatePaletteSelection,
    renderPalette,
    renderSelector,
    addPaletteColor,
    updatePaletteColorFromFill,
    showPaletteMessage,
    createImportInput,
    createActionButtons
  };
}