const PALETTE_LIMIT = 64;
const PROJECT_COMMENT_MAGIC = " // _pixel_art_palette_project";
const COSTUME_COMMENT_MAGIC = " // _pixel_art_palette_costume";
const PROJECT_COMMENT_HEADER = "Scratch Addons Pixel Palette";
const COSTUME_COMMENT_HEADER = "Scratch Addons Palette Mapping";

export function createPaletteModule(addon, state, redux, msg) {
  if (!Array.isArray(state.projectPalettes)) {
    state.projectPalettes = [];
  }
  if (typeof state.selectedPaletteId === "undefined") {
    state.selectedPaletteId = null;
  }
  state.paletteDropdown = null;
  state.teardownVmTargetsListener = null;

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
    } catch (error) {
      console.error("pixel-art-tools: failed to read fill color", error);
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
      state.paletteGrid
        .querySelectorAll(".sa-pixel-art-color[data-index]")
        .forEach((button) => {
          button.dataset.selected = button.dataset.index === String(selectedIndex) ? "true" : "false";
        });
    }
  };

  const toggleEditingPaletteColor = (index) => {
    if (state.editingPaletteIndex === index) {
      state.editingPaletteIndex = -1;
    } else {
      state.editingPaletteIndex = index;
    }

    if (state.paletteGrid) {
      state.paletteGrid
        .querySelectorAll(".sa-pixel-art-color[data-index]")
        .forEach((button) => {
          button.dataset.editing = button.dataset.index === String(state.editingPaletteIndex) ? "true" : "false";
        });
    }
  };

  const showPaletteMessage = (message, type = "info") => {
    if (state.paletteMessage) {
      state.paletteMessage.textContent = message;
      state.paletteMessage.className = `sa-pixel-art-palette-message sa-pixel-art-palette-message-${type}`;
      state.paletteMessage.style.display = "block";

      setTimeout(() => {
        if (state.paletteMessage) {
          state.paletteMessage.style.display = "none";
        }
      }, 3000);
    }
  };

  const getVm = () => addon.tab?.traps?.vm;
  const getRuntime = () => getVm()?.runtime;
  const getStageTarget = () => getRuntime()?.getTargetForStage();
  const getEditingTarget = () => getVm()?.editingTarget || getRuntime()?.getEditingTarget?.();
  const getCurrentCostume = () => {
    const target = getEditingTarget();
    if (!target) return null;
    const costumes = target.sprite?.costumes;
    const index = target.currentCostume;
    if (!Array.isArray(costumes)) return null;
    return costumes[index] || null;
  };
  const getCostumeKey = (costume) => costume?.md5Ext || costume?.md5 || costume?.assetId || costume?.name || null;

  const randomId = () => Math.random().toString(36).slice(2, 10);

  const markProjectChanged = (target) => {
    const vm = getVm();
    if (!vm) return;
    vm.runtime.emitProjectChanged();
    if (target && vm.editingTarget === target) {
      vm.emitWorkspaceUpdate();
    }
  };

  const parseCommentPayload = (text, magic) => {
    const lines = text.split("\n");
    for (const raw of lines) {
      const line = raw.trim();
      if (!line.endsWith(magic)) continue;
      const payloadText = line.slice(0, -magic.length);
      try {
        return JSON.parse(payloadText);
      } catch (error) {
        console.warn("pixel-art-tools: failed to parse palette comment", error);
        return null;
      }
    }
    return null;
  };

  const serializeCommentPayload = (payload, magic, header) => {
    const body = JSON.stringify(payload);
    return header ? `${header}\n${body}${magic}` : `${body}${magic}`;
  };

  const findProjectComment = () => {
    const stage = getStageTarget();
    if (!stage) return null;
    return Object.values(stage.comments || {}).find((comment) => comment.text?.includes(PROJECT_COMMENT_MAGIC)) || null;
  };

  const sanitizePaletteList = (palettes) => {
    if (!Array.isArray(palettes)) return [];
    const seenIds = new Set();
    const list = [];
    for (const entry of palettes) {
      if (!entry || typeof entry !== "object") continue;
      let { id, name, colors } = entry;
      if (typeof id !== "string" || !id) {
        id = `pal-${randomId()}`;
      }
      if (seenIds.has(id)) {
        id = `pal-${randomId()}`;
      }
      seenIds.add(id);
      if (typeof name !== "string" || !name.trim()) {
        const base = msg("paletteTitle") || "Palette";
        name = `${base} ${list.length + 1}`;
      }
      const sanitizedColors = Array.isArray(colors)
        ? colors
            .map((color) => sanitizeHex(color))
            .filter((value, index, array) => value && array.indexOf(value) === index)
            .slice(0, PALETTE_LIMIT)
        : [];
      list.push({ id, name, colors: sanitizedColors });
    }
    return list;
  };

  const loadProjectPalettes = () => {
    const comment = findProjectComment();
    if (!comment) return [];
    const payload = parseCommentPayload(comment.text, PROJECT_COMMENT_MAGIC);
    if (!payload || typeof payload !== "object") return [];
    return sanitizePaletteList(payload.palettes);
  };

  const writeProjectComment = () => {
    const stage = getStageTarget();
    if (!stage) return;
    const snapshot = state.projectPalettes.map((palette) => ({
      id: palette.id,
      name: palette.name,
      colors: palette.colors.slice(0, PALETTE_LIMIT),
    }));
    const text = serializeCommentPayload({ palettes: snapshot }, PROJECT_COMMENT_MAGIC, PROJECT_COMMENT_HEADER);
    const existing = findProjectComment();
    if (existing) {
      existing.text = text;
    } else {
      stage.createComment(randomId(), null, text, 60, 60, 360, 120, true);
    }
    markProjectChanged(stage);
  };

  const findPaletteMappingComment = (target) => {
    if (!target) return null;
    const comments = target.comments || {};
    for (const comment of Object.values(comments)) {
      if (!comment.text || !comment.text.includes(COSTUME_COMMENT_MAGIC)) continue;
      const payload = parseCommentPayload(comment.text, COSTUME_COMMENT_MAGIC);
      if (payload && typeof payload === "object" && payload.mappings && typeof payload.mappings === "object") {
        return comment;
      }
    }
    return null;
  };

  const sanitizePaletteMappings = (value) => {
    const result = Object.create(null);
    if (!value || typeof value !== "object") return result;
    for (const [key, paletteId] of Object.entries(value)) {
      if (typeof key !== "string" || !key) continue;
      if (typeof paletteId !== "string" || !paletteId) continue;
      result[key] = paletteId;
    }
    return result;
  };

  const loadPaletteMappings = (target) => {
    if (!target) return Object.create(null);
    const comments = target.comments || {};
    const mappings = Object.create(null);
    for (const comment of Object.values(comments)) {
      if (!comment.text || !comment.text.includes(COSTUME_COMMENT_MAGIC)) continue;
      const payload = parseCommentPayload(comment.text, COSTUME_COMMENT_MAGIC);
      if (!payload || typeof payload !== "object") continue;
      if (payload.mappings && typeof payload.mappings === "object") {
        Object.assign(mappings, sanitizePaletteMappings(payload.mappings));
      } else if (typeof payload.costumeKey === "string" && typeof payload.paletteId === "string") {
        mappings[payload.costumeKey] = payload.paletteId;
      }
    }
    return mappings;
  };

  const writePaletteMappings = (target, mappings) => {
    if (!target) return;
    const snapshot = sanitizePaletteMappings(mappings);
    const text = serializeCommentPayload({ mappings: snapshot }, COSTUME_COMMENT_MAGIC, COSTUME_COMMENT_HEADER);
    const existing = findPaletteMappingComment(target);
    let activeCommentId;
    if (existing) {
      existing.text = text;
      activeCommentId = existing.id;
    } else {
      const commentId = randomId();
      target.createComment(commentId, null, text, 80, 80, 320, 100, true);
      activeCommentId = commentId;
    }

    // Remove legacy single-costume comments to avoid duplication.
    const comments = target.comments || {};
    for (const comment of Object.values(comments)) {
      if (!comment.text || !comment.text.includes(COSTUME_COMMENT_MAGIC)) continue;
      if (comment.id === activeCommentId) continue;
      const payload = parseCommentPayload(comment.text, COSTUME_COMMENT_MAGIC);
      if (
        payload &&
        typeof payload === "object" &&
        (
          (payload.mappings && typeof payload.mappings === "object") ||
          (typeof payload.costumeKey === "string" && typeof payload.paletteId === "string")
        )
      ) {
        delete target.comments[comment.id];
      }
    }

    markProjectChanged(target);
  };

  const readCostumePaletteId = (target, costume) => {
    const costumeKey = getCostumeKey(costume);
    if (!costumeKey) return null;
    const mappings = loadPaletteMappings(target);
    return mappings[costumeKey] || null;
  };

  const writeCostumePaletteId = (target, costume, paletteId) => {
    const costumeKey = getCostumeKey(costume);
    if (!target || !costumeKey || !paletteId) return;
    const mappings = loadPaletteMappings(target);
    mappings[costumeKey] = paletteId;
    writePaletteMappings(target, mappings);
  };

  const generatePaletteName = () => {
    const base = msg("paletteTitle") || "Palette";
    return `${base} ${state.projectPalettes.length + 1}`;
  };

  const createPalette = (name) => ({
    id: `pal-${randomId()}`,
    name: name || generatePaletteName(),
    colors: [],
  });

  const getActivePalette = () => state.projectPalettes.find((palette) => palette.id === state.selectedPaletteId) || null;

  const renderPaletteSelector = () => {
    if (!state.paletteDropdown) return;
    state.paletteDropdown.innerHTML = "";

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.disabled = true;
    placeholder.hidden = true;
    placeholder.textContent = msg("paletteSelectPlaceholder") || "Select a palette";
    if (!state.selectedPaletteId) {
      placeholder.hidden = false;
      placeholder.selected = true;
    }
    state.paletteDropdown.appendChild(placeholder);

    state.projectPalettes.forEach((palette) => {
      const option = document.createElement("option");
      option.value = palette.id;
      option.textContent = palette.name;
      if (palette.id === state.selectedPaletteId) {
        option.selected = true;
      }
      state.paletteDropdown.appendChild(option);
    });

    const createOption = document.createElement("option");
    createOption.value = "__create__";
    createOption.textContent = msg("paletteCreateNew") || "Create new palette";
    state.paletteDropdown.appendChild(createOption);
  };

  const persistProjectPalettes = () => {
    writeProjectComment();
    renderPaletteSelector();
  };

  const persistCostumeSelection = () => {
    const target = getEditingTarget();
    const costume = getCurrentCostume();
    if (!target || !costume || !state.selectedPaletteId) return;
    writeCostumePaletteId(target, costume, state.selectedPaletteId);
  };

  const ensureActivePalette = () => {
    if (!state.projectPalettes.length) {
      const palette = createPalette();
      state.projectPalettes.push(palette);
      state.selectedPaletteId = palette.id;
      state.palette = palette.colors;
    }
    if (!state.selectedPaletteId && state.projectPalettes.length) {
      const palette = state.projectPalettes[0];
      state.selectedPaletteId = palette.id;
      state.palette = palette.colors;
    }
  };

  const setActivePalette = (paletteId, { persistCostume = true } = {}) => {
    const palette = state.projectPalettes.find((entry) => entry.id === paletteId);
    if (!palette) return;
    state.selectedPaletteId = paletteId;
    state.palette = palette.colors;
    state.editingPaletteIndex = -1;
    state.selectedPaletteIndex = -1;
    renderPaletteSelector();
    renderPalette();
    updatePaletteSelection();
    if (persistCostume) {
      persistCostumeSelection();
    }
  };

  const syncPaletteForCurrentCostume = () => {
    const loaded = loadProjectPalettes();
    if (loaded.length || findProjectComment()) {
      state.projectPalettes = loaded;
    }
    ensureActivePalette();

    const target = getEditingTarget();
    const costume = getCurrentCostume();
    if (target && costume) {
      let paletteId = readCostumePaletteId(target, costume);
      if (!paletteId || !state.projectPalettes.some((palette) => palette.id === paletteId)) {
        paletteId = state.projectPalettes[0].id;
        state.selectedPaletteId = paletteId;
        state.palette = state.projectPalettes[0].colors;
        persistProjectPalettes();
        persistCostumeSelection();
      } else {
        state.selectedPaletteId = paletteId;
        const palette = getActivePalette();
        state.palette = palette ? palette.colors : [];
      }
    } else {
      const palette = getActivePalette();
      state.palette = palette ? palette.colors : [];
    }

    renderPaletteSelector();
    renderPalette();
    updatePaletteSelection();
  };

  let paletteSyncPending = false;
  const schedulePaletteSync = () => {
    if (paletteSyncPending) return;
    paletteSyncPending = true;
    const microtask = typeof queueMicrotask === "function" ? queueMicrotask : (callback) => Promise.resolve().then(callback);
    microtask(() => {
      paletteSyncPending = false;
      syncPaletteForCurrentCostume();
    });
  };

  const colourAlreadyExistsMessage = () => msg("colorAlreadyExists") || "Color already exists";

  const renderPalette = () => {
    if (!state.paletteGrid) return;
    state.paletteGrid.innerHTML = "";
    const palette = getActivePalette();
    const colors = palette ? palette.colors : [];

    colors.forEach((color, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "sa-pixel-art-color";
      button.style.backgroundColor = color;
      button.title = color;
      button.dataset.index = String(index);
      button.dataset.color = color;
      if (index === state.selectedPaletteIndex) {
        button.dataset.selected = "true";
      }
      if (index === state.editingPaletteIndex) {
        button.dataset.editing = "true";
      }
      button.addEventListener("click", (event) => {
        if (event.shiftKey) {
          toggleEditingPaletteColor(index);
          setFillHex(color);
        } else {
          setFillHex(color);
          updatePaletteSelection(color);
        }
      });
      button.addEventListener("contextmenu", (event) => {
        event.preventDefault();
        if (!palette) return;
        palette.colors.splice(index, 1);
        state.editingPaletteIndex = -1;
        state.selectedPaletteIndex = -1;
        renderPalette();
        updatePaletteSelection();
        persistProjectPalettes();
        persistCostumeSelection();
      });
      state.paletteGrid.appendChild(button);
    });

    const addCell = document.createElement("button");
    addCell.type = "button";
    addCell.className = "sa-pixel-art-color sa-pixel-art-color-add";
    addCell.setAttribute("aria-label", msg("addColor"));
    addCell.dataset.role = "add";
    addCell.addEventListener("click", () => {
      addPaletteColor();
    });
    state.paletteGrid.appendChild(addCell);

    if (state.paletteNotice) {
      state.paletteNotice.hidden = colors.length > 0;
    }
  };

  const addPaletteColor = (hex) => {
    ensureActivePalette();
    const palette = getActivePalette();
    if (!palette) return;

    const normalized = sanitizeHex(hex || getFillHex());
    if (!normalized) return;

    if (palette.colors.includes(normalized)) {
      showPaletteMessage(colourAlreadyExistsMessage(), "info");
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
    persistProjectPalettes();
    persistCostumeSelection();
  };

  const updatePaletteColorFromFill = (newHex) => {
    const palette = getActivePalette();
    if (!palette) return;
    if (state.editingPaletteIndex < 0 || state.editingPaletteIndex >= palette.colors.length) {
      return;
    }
    const normalized = sanitizeHex(newHex);
    if (!normalized) return;
    if (palette.colors.includes(normalized)) {
      showPaletteMessage(colourAlreadyExistsMessage(), "info");
      return;
    }
    palette.colors[state.editingPaletteIndex] = normalized;
    renderPalette();
    updatePaletteSelection(normalized);
    persistProjectPalettes();
    persistCostumeSelection();
  };

  const parseGPL = (text) => {
    const lines = text.split(/\r?\n/);
    const colors = [];
    for (const line of lines) {
      if (!line || line.startsWith("#")) continue;
      if (!/\d/.test(line)) continue;
      const parts = line.trim().split(/\s+/);
      if (parts.length < 3) continue;
      const [r, g, b] = parts.slice(0, 3).map((part) => Number.parseInt(part, 10));
      if ([r, g, b].some((value) => Number.isNaN(value))) continue;
      const hex = `#${[r, g, b]
        .map((value) => Math.max(0, Math.min(255, value)).toString(16).toUpperCase().padStart(2, "0"))
        .join("")}`;
      if (!colors.includes(hex)) {
        colors.push(hex);
      }
      if (colors.length >= PALETTE_LIMIT) break;
    }
    return colors;
  };

  const exportGPL = () => {
    const palette = getActivePalette();
    if (!palette || palette.colors.length === 0) return;
    const header = [
      "GIMP Palette",
      `# ${msg("paletteExportLabel")}`,
      "Name: Scratch Addons Pixel Palette",
      "Columns: 0",
      "#",
    ].join("\n");
    const body = palette.colors
      .map((hex) => {
        const r = Number.parseInt(hex.slice(1, 3), 16);
        const g = Number.parseInt(hex.slice(3, 5), 16);
        const b = Number.parseInt(hex.slice(5, 7), 16);
        return `${r}	${g}	${b}	${hex}`;
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

  const handleDeletePalette = async () => {
    const palette = getActivePalette();
    if (!palette) return;

    const confirmMessage = `${msg("deletePaletteConfirm")}

${palette.name}`;
    const confirmed = await addon.tab.confirm(
      msg("deletePalette"),
      confirmMessage,
      {
        useEditorClasses: true,
      }
    );

    if (!confirmed) return;

    const paletteId = palette.id;
    const runtime = getRuntime();

    state.projectPalettes = state.projectPalettes.filter((entry) => entry.id !== paletteId);

    if (!state.projectPalettes.length) {
      const fallbackPalette = createPalette();
      state.projectPalettes.push(fallbackPalette);
    }

    const fallbackId = state.projectPalettes[0].id;

    if (runtime) {
      for (const target of runtime.targets) {
        const mappings = loadPaletteMappings(target);
        let dirty = false;
        for (const costumeKey of Object.keys(mappings)) {
          if (mappings[costumeKey] === paletteId) {
            mappings[costumeKey] = fallbackId;
            dirty = true;
          }
        }
        if (dirty) {
          writePaletteMappings(target, mappings);
        }
      }
    }

    setActivePalette(fallbackId, { persistCostume: false });
    persistProjectPalettes();
    persistCostumeSelection();
  };

  const createPalettePanel = () => {
    const panel = document.createElement("section");
    panel.className = "sa-pixel-art-palette";
    panel.style.display = "none";

    const header = document.createElement("header");
    header.className = "sa-pixel-art-palette-header";
    header.textContent = msg("paletteTitle");
    panel.appendChild(header);

    const selectorRow = document.createElement("div");
    selectorRow.className = "sa-pixel-art-palette-select-row";

    const dropdown = document.createElement("select");
    dropdown.className = "sa-pixel-art-palette-select";
    dropdown.addEventListener("change", (event) => {
      const value = event.target.value;
      if (value === "__create__") {
        const newPalette = createPalette();
        state.projectPalettes.push(newPalette);
        setActivePalette(newPalette.id);
        persistProjectPalettes();
        return;
      }
      if (value) {
        setActivePalette(value);
      }
    });
    selectorRow.appendChild(dropdown);
    state.paletteDropdown = dropdown;

    panel.appendChild(selectorRow);

    const importInput = document.createElement("input");
    importInput.type = "file";
    importInput.accept = ".gpl";
    importInput.className = "sa-pixel-art-hidden";
    importInput.addEventListener("change", (event) => {
      const file = event.target.files && event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        const palette = getActivePalette();
        if (!palette) return;
        try {
          const parsed = parseGPL(String(reader.result));
          if (parsed.length) {
            palette.colors.length = 0;
            palette.colors.push(...parsed.slice(0, PALETTE_LIMIT));
            renderPalette();
            updatePaletteSelection();
            persistProjectPalettes();
            persistCostumeSelection();
          }
        } catch (error) {
          console.error("pixel-art-tools: failed to import palette", error);
        }
      });
      reader.readAsText(file);
      importInput.value = "";
    });
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

    const actionsRow = document.createElement("div");
    actionsRow.className = "sa-pixel-art-palette-actions";

    const createActionButton = (iconName, label, { danger = false, invert = false } = {}) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "sa-pixel-art-action-button";
      if (danger) button.classList.add("sa-pixel-art-action-button--danger");
      button.title = label;
      button.setAttribute("aria-label", label);

      const icon = document.createElement("img");
      icon.src = `${addon.self.dir}/icons/${iconName}`;
      icon.alt = "";
      icon.className = "sa-pixel-art-icon";
      if (invert) icon.classList.add("sa-pixel-art-icon--invert");
      button.appendChild(icon);

      return button;
    };

    const importBtn = createActionButton("import.svg", msg("importPalette"));
    importBtn.addEventListener("click", () => importInput.click());
    actionsRow.appendChild(importBtn);

    const exportBtn = createActionButton("export.svg", msg("exportPalette"), { invert: true });
    exportBtn.addEventListener("click", exportGPL);
    actionsRow.appendChild(exportBtn);

    const deleteBtn = createActionButton("delete.svg", msg("deletePalette"), { danger: true });
    deleteBtn.addEventListener("click", handleDeletePalette);
    actionsRow.appendChild(deleteBtn);

    panel.appendChild(actionsRow);

    return panel;
  };

  const setupPalettePanel = async () => {
    const panel = createPalettePanel();
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

      addon.tab.appendToSharedSpace({
        space: "paintEditorModeSelector",
        element: panel,
        order: 1,
      });

      renderPaletteSelector();
      renderPalette();
    }
  };

  const attachVmTargetsListener = () => {
    try {
      const vm = getVm();
      if (!vm || typeof vm.on !== "function") return;
      if (state.teardownVmTargetsListener) {
        state.teardownVmTargetsListener();
      }
      const handler = () => schedulePaletteSync();
      vm.on("targetsUpdate", handler);
      state.teardownVmTargetsListener = () => {
        if (typeof vm.off === "function") {
          vm.off("targetsUpdate", handler);
        } else if (typeof vm.removeListener === "function") {
          vm.removeListener("targetsUpdate", handler);
        }
        state.teardownVmTargetsListener = null;
      };
    } catch (error) {
      console.error("pixel-art-tools: failed to attach targetsUpdate listener", error);
    }
  };

  addon.self.addEventListener("disabled", () => {
    if (state.teardownVmTargetsListener) {
      state.teardownVmTargetsListener();
    }
  });

  addon.self.addEventListener("reenabled", () => {
    attachVmTargetsListener();
    schedulePaletteSync();
  });

  attachVmTargetsListener();
  schedulePaletteSync();

  return {
    updatePaletteSelection,
    renderPalette,
    addPaletteColor,
    setupPalettePanel,
    updatePaletteColorFromFill,
  };
}
