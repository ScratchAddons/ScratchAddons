const PALETTE_LIMIT = 64;
const PROJECT_COMMENT_MAGIC = " // _pixel_art_palette_project";
const COSTUME_COMMENT_MAGIC = " // _pixel_art_palette_costume";

export function createPaletteModule(addon, state, redux, msg) {
  const vm = addon.tab.traps.vm;
  const runtime = vm.runtime;

  Object.assign(state, {
    projectPalettes: state.projectPalettes || [],
    selectedPaletteId: state.selectedPaletteId || null,
    paletteDropdown: null,
    teardownVmTargetsListener: null,
  });

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

  const randomId = () => Math.random().toString(36).slice(2, 10);

  const parseComment = (text, magic) => {
    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (trimmed.endsWith(magic)) {
        try {
          return JSON.parse(trimmed.slice(0, -magic.length));
        } catch {
          return null;
        }
      }
    }
    return null;
  };

  const serializeComment = (payload, magic, header) =>
    `${header ? header + "\n" : ""}${JSON.stringify(payload)}${magic}`;

  const findProjectComment = () =>
    Object.values(runtime.getTargetForStage()?.comments || {}).find((c) => c.text?.includes(PROJECT_COMMENT_MAGIC));

  const sanitizePalettes = (palettes) => {
    if (!Array.isArray(palettes)) return [];
    const seenIds = new Set();
    return palettes.map((entry, index) => {
      let { id, name, colors } = entry || {};
      if (!id || seenIds.has(id)) id = `pal-${randomId()}`;
      seenIds.add(id);
      if (!name?.trim()) name = `${msg("paletteTitle") || "Palette"} ${index + 1}`;
      const sanitizedColors = Array.isArray(colors)
        ? [...new Set(colors.map(sanitizeHex).filter(Boolean))].slice(0, PALETTE_LIMIT)
        : [];
      return { id, name, colors: sanitizedColors };
    });
  };

  const loadProjectPalettes = () => {
    const comment = findProjectComment();
    if (!comment) return [];
    const payload = parseComment(comment.text, PROJECT_COMMENT_MAGIC);
    return sanitizePalettes(payload?.palettes);
  };

  const writeProjectComment = () => {
    const s = runtime.getTargetForStage();
    if (!s) return;
    const snapshot = state.projectPalettes.map((p) => ({ ...p, colors: p.colors.slice(0, PALETTE_LIMIT) }));
    const text = serializeComment({ palettes: snapshot }, PROJECT_COMMENT_MAGIC, "Scratch Addons Pixel Palette");
    const existing = findProjectComment();
    if (existing) existing.text = text;
    else s.createComment(randomId(), null, text, 60, 60, 360, 120, true);
    runtime.emitProjectChanged();
  };

  const loadMappings = (target) => {
    const mappings = {};
    Object.values(target?.comments || {}).forEach((comment) => {
      if (!comment.text?.includes(COSTUME_COMMENT_MAGIC)) return;
      const payload = parseComment(comment.text, COSTUME_COMMENT_MAGIC);
      if (payload?.mappings) Object.assign(mappings, payload.mappings);
      else if (payload?.costumeKey && payload?.paletteId) mappings[payload.costumeKey] = payload.paletteId;
    });
    return mappings;
  };

  const writeMappings = (target, mappings) => {
    if (!target) return;
    const text = serializeComment({ mappings }, COSTUME_COMMENT_MAGIC, "Scratch Addons Palette Mapping");
    const existing = Object.values(target.comments || {}).find(
      (c) => c.text?.includes(COSTUME_COMMENT_MAGIC) && parseComment(c.text, COSTUME_COMMENT_MAGIC)?.mappings
    );
    if (existing) existing.text = text;
    else target.createComment(randomId(), null, text, 80, 80, 320, 100, true);
    runtime.emitProjectChanged();
  };

  const getCostumeKey = (c) => c?.md5Ext || c?.md5 || c?.assetId || c?.name;

  const readCostumePaletteId = () => {
    const t = vm.editingTarget || runtime.getEditingTarget();
    const c = t?.sprite?.costumes?.[t.currentCostume];
    const key = getCostumeKey(c);
    return key ? loadMappings(t)[key] : null;
  };

  const writeCostumePaletteId = (paletteId) => {
    const t = vm.editingTarget || runtime.getEditingTarget();
    const c = t?.sprite?.costumes?.[t.currentCostume];
    const key = getCostumeKey(c);
    if (!t || !key || !paletteId) return;
    const mappings = loadMappings(t);
    mappings[key] = paletteId;
    writeMappings(t, mappings);
  };

  const createPalette = (name) => ({
    id: `pal-${randomId()}`,
    name: name || `${msg("paletteTitle") || "Palette"} ${state.projectPalettes.length + 1}`,
    colors: [],
  });

  const getActivePalette = () => state.projectPalettes.find((p) => p.id === state.selectedPaletteId);

  const renderSelector = () => {
    if (!state.paletteDropdown) return;
    state.paletteDropdown.innerHTML = "";

    const placeholder = Object.assign(document.createElement("option"), {
      value: "",
      disabled: true,
      hidden: !!state.selectedPaletteId,
      selected: !state.selectedPaletteId,
      textContent: msg("paletteSelectPlaceholder") || "Select a palette",
    });
    state.paletteDropdown.appendChild(placeholder);

    state.projectPalettes.forEach((palette) => {
      const option = Object.assign(document.createElement("option"), {
        value: palette.id,
        textContent: palette.name,
        selected: palette.id === state.selectedPaletteId,
      });
      state.paletteDropdown.appendChild(option);
    });

    const createOption = Object.assign(document.createElement("option"), {
      value: "__create__",
      textContent: msg("paletteCreateNew") || "Create new palette",
    });
    state.paletteDropdown.appendChild(createOption);
  };

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
    renderSelector();
    renderPalette();
    updatePaletteSelection();
    if (persistCostume) writeCostumePaletteId(paletteId);
  };

  const syncPalette = () => {
    const loaded = loadProjectPalettes();
    if (loaded.length || findProjectComment()) state.projectPalettes = loaded;
    ensureActivePalette();

    const paletteId = readCostumePaletteId();
    if (paletteId && state.projectPalettes.some((p) => p.id === paletteId)) {
      setActivePalette(paletteId, false);
    } else {
      const palette = state.projectPalettes[0];
      setActivePalette(palette.id);
    }
  };

  let syncPending = false;
  const scheduleSync = () => {
    if (syncPending) return;
    syncPending = true;
    (typeof queueMicrotask === "function" ? queueMicrotask : (cb) => Promise.resolve().then(cb))(() => {
      syncPending = false;
      syncPalette();
    });
  };

  const renderPalette = () => {
    if (!state.paletteGrid) return;
    state.paletteGrid.innerHTML = "";
    const palette = getActivePalette();
    const colors = palette?.colors || [];

    colors.forEach((color, index) => {
      const button = Object.assign(document.createElement("button"), {
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
        if (!palette) return;
        palette.colors.splice(index, 1);
        state.editingPaletteIndex = state.selectedPaletteIndex = -1;
        renderPalette();
        updatePaletteSelection();
        writeProjectComment();
        writeCostumePaletteId(state.selectedPaletteId);
      };

      state.paletteGrid.appendChild(button);
    });

    const addButton = Object.assign(document.createElement("button"), {
      type: "button",
      className: "sa-pixel-art-color sa-pixel-art-color-add",
    });
    addButton.setAttribute("aria-label", msg("addColor"));
    addButton.onclick = () => addPaletteColor();
    state.paletteGrid.appendChild(addButton);

    if (state.paletteNotice) state.paletteNotice.hidden = colors.length > 0;
  };

  const addPaletteColor = (hex) => {
    ensureActivePalette();
    const palette = getActivePalette();
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
    writeProjectComment();
    writeCostumePaletteId(state.selectedPaletteId);
  };

  const updatePaletteColorFromFill = (newHex) => {
    const palette = getActivePalette();
    const normalized = sanitizeHex(newHex);
    if (!palette || state.editingPaletteIndex < 0 || !normalized) return;

    if (palette.colors.includes(normalized)) {
      showPaletteMessage(msg("colorAlreadyExists") || "Color already exists", "info");
      return;
    }

    palette.colors[state.editingPaletteIndex] = normalized;
    renderPalette();
    updatePaletteSelection(normalized);
    writeProjectComment();
    writeCostumePaletteId(state.selectedPaletteId);
  };

  // ------- import, export, delete helpers -------
  const parseGPL = (text) => {
    const lines = text.split(/\r?\n/);
    const colors = [];
    for (const line of lines) {
      if (!line || line.startsWith("#") || !/\d/.test(line)) continue;
      const parts = line.trim().split(/\s+/);
      if (parts.length < 3) continue;
      const [r, g, b] = parts.slice(0, 3).map((v) => parseInt(v, 10));
      if ([r, g, b].some((x) => Number.isNaN(x))) continue;
      const hex = `#${[r, g, b].map((v) => Math.max(0, Math.min(255, v)).toString(16).toUpperCase().padStart(2, "0")).join("")}`;
      if (!colors.includes(hex)) colors.push(hex);
      if (colors.length >= PALETTE_LIMIT) break;
    }
    return colors;
  };

  const exportGPL = () => {
    const p = getActivePalette();
    if (!p || !p.colors.length) return;
    const header = [
      "GIMP Palette",
      `# ${msg("paletteExportLabel") || ""}`.trim(),
      "Name: Scratch Addons Pixel Palette",
      "Columns: 0",
      "#",
    ].join("\n");
    const body = p.colors
      .map((hex) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `${r}\t${g}\t${b}\t${hex}`;
      })
      .join("\n");
    const blob = new Blob([`${header}\n${body}\n`], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pixel-palette.gpl";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  };

  const handleDeletePalette = async () => {
    const p = getActivePalette();
    if (!p) return;
    const confirmed = await addon.tab.confirm(
      msg("deletePalette"),
      `${msg("deletePaletteConfirm")}\n\n${p.name}`,
      { useEditorClasses: true }
    );
    if (!confirmed) return;

    const removedId = p.id;
    state.projectPalettes = state.projectPalettes.filter((e) => e.id !== removedId);
    if (!state.projectPalettes.length) state.projectPalettes.push(createPalette());

    const fallbackId = state.projectPalettes[0].id;

    // remap costume mappings
    for (const t of runtime.targets || []) {
      const mappings = loadMappings(t);
      let dirty = false;
      for (const k of Object.keys(mappings)) {
        if (mappings[k] === removedId) {
          mappings[k] = fallbackId;
          dirty = true;
        }
      }
      if (dirty) writeMappings(t, mappings);
    }

    setActivePalette(fallbackId, false);
    writeProjectComment();
    writeCostumePaletteId(fallbackId);
  };
  // ------- end helpers -------

  const setupPalettePanel = async () => {
    const panel = Object.assign(document.createElement("section"), { className: "sa-pixel-art-palette" });
    panel.style.display = "none";

    const header = Object.assign(document.createElement("header"), {
      className: "sa-pixel-art-palette-header",
      textContent: msg("paletteTitle"),
    });
    panel.appendChild(header);

    const selectorRow = Object.assign(document.createElement("div"), { className: "sa-pixel-art-palette-select-row" });

    const dropdown = Object.assign(document.createElement("select"), { className: "sa-pixel-art-palette-select" });
    dropdown.onchange = (e) => {
      if (e.target.value === "__create__") {
        const newPalette = createPalette();
        state.projectPalettes.push(newPalette);
        setActivePalette(newPalette.id);
        writeProjectComment();
      } else if (e.target.value) {
        setActivePalette(e.target.value);
      }
    };
    selectorRow.appendChild(dropdown);
    panel.appendChild(selectorRow);
    state.paletteDropdown = dropdown;

    // hidden input for import
    const importInput = Object.assign(document.createElement("input"), {
      type: "file",
      accept: ".gpl",
      className: "sa-pixel-art-hidden",
    });
    importInput.onchange = (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const p = getActivePalette();
        if (!p) return;
        try {
          const parsed = parseGPL(String(reader.result));
          if (parsed.length) {
            p.colors.length = 0;
            p.colors.push(...parsed.slice(0, PALETTE_LIMIT));
            renderPalette();
            updatePaletteSelection();
            writeProjectComment();
            writeCostumePaletteId(state.selectedPaletteId);
          }
        } catch (err) {
          console.error("pixel-art-tools: import failed", err);
        }
      };
      reader.readAsText(file);
      importInput.value = "";
    };
    panel.appendChild(importInput);

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

    // actions row: import, export, delete
    const actionsRow = Object.assign(document.createElement("div"), { className: "sa-pixel-art-palette-actions" });
    const makeActionBtn = (icon, label, extraClass) => {
      const btn = Object.assign(document.createElement("button"), {
        type: "button",
        className: `sa-pixel-art-action-button${extraClass ? " " + extraClass : ""}`,
        title: label,
      });
      btn.setAttribute("aria-label", label);
      const img = Object.assign(document.createElement("img"), {
        src: `${addon.self.dir}/icons/${icon}`,
        alt: "",
        className: "sa-pixel-art-icon" + (icon === "export.svg" ? " sa-pixel-art-icon--invert" : ""),
      });
      btn.appendChild(img);
      return btn;
    };

    const importBtn = makeActionBtn("import.svg", msg("importPalette"));
    importBtn.onclick = () => importInput.click();
    actionsRow.appendChild(importBtn);

    const exportBtn = makeActionBtn("export.svg", msg("exportPalette"), "");
    exportBtn.onclick = exportGPL;
    actionsRow.appendChild(exportBtn);

    const deleteBtn = makeActionBtn("delete.svg", msg("deletePalette"), "sa-pixel-art-action-button--danger");
    deleteBtn.onclick = handleDeletePalette;
    actionsRow.appendChild(deleteBtn);

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
      renderSelector();
      renderPalette();
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
  addon.self.addEventListener("reenabled", () => {
    attachVmListener();
    scheduleSync();
  });

  attachVmListener();
  scheduleSync();

  return { updatePaletteSelection, renderPalette, addPaletteColor, setupPalettePanel, updatePaletteColorFromFill };
}
