const PALETTE_LIMIT = 64;
const PROJECT_MAGIC = " // _pixel_art_palette_project";
const COSTUME_MAGIC = " // _pixel_art_palette_costume";

export function createStorageModule(addon, vm, runtime, msg, state, ui) {
  const randomId = () => Math.random().toString(36).slice(2, 10);

  const parseComment = (text, magic) => {
    const line = text?.split("\n").find((l) => l.trim().endsWith(magic));
    try {
      return line ? JSON.parse(line.trim().slice(0, -magic.length)) : null;
    } catch {
      return null;
    }
  };

  const findComment = (target, magic, filter) =>
    Object.values(target?.comments || {}).find(
      (c) => c.text?.includes(magic) && (!filter || filter(parseComment(c.text, magic)))
    );

  const writeComment = (target, magic, payload, header, pos) => {
    if (!target) return;
    const text = `${header}\n${JSON.stringify(payload)}${magic}`;
    const existing = findComment(target, magic, payload.mappings ? (p) => p?.mappings : null);
    existing ? (existing.text = text) : target.createComment(randomId(), null, text, ...pos, true);
    runtime.emitProjectChanged();
  };

  const sanitizeHex = (v) => {
    const t = v?.toString().trim().replace(/^#/, "");
    return /^[0-9a-f]{6}$/i.test(t) ? `#${t.toUpperCase()}` : null;
  };

  const sanitizePalettes = (palettes) => {
    if (!Array.isArray(palettes)) return [];
    const seenIds = new Set();
    return palettes.map((entry, i) => {
      let { id, name, colors } = entry || {};
      if (!id || seenIds.has(id)) id = `pal-${randomId()}`;
      seenIds.add(id);
      return {
        id,
        name: name?.trim() || `${msg("paletteTitle") || "Palette"} ${i + 1}`,
        colors: Array.isArray(colors)
          ? [...new Set(colors.map(sanitizeHex).filter(Boolean))].slice(0, PALETTE_LIMIT)
          : [],
      };
    });
  };

  const loadProjectPalettes = () => {
    const comment = findComment(runtime.getTargetForStage(), PROJECT_MAGIC);
    return sanitizePalettes(comment ? parseComment(comment.text, PROJECT_MAGIC)?.palettes : []);
  };

  const writeProjectComment = (palettes) => {
    const snapshot = palettes.map((p) => ({ ...p, colors: p.colors.slice(0, PALETTE_LIMIT) }));
    writeComment(
      runtime.getTargetForStage(),
      PROJECT_MAGIC,
      { palettes: snapshot },
      "Pixel Palette",
      [60, 60, 360, 120]
    );
  };

  const loadMappings = (target) => {
    const mappings = {};
    Object.values(target?.comments || {}).forEach((c) => {
      if (!c.text?.includes(COSTUME_MAGIC)) return;
      const p = parseComment(c.text, COSTUME_MAGIC);
      if (p?.mappings) Object.assign(mappings, p.mappings);
      else if (p?.costumeKey && p?.paletteId) mappings[p.costumeKey] = p.paletteId;
    });
    return mappings;
  };

  const writeMappings = (target, mappings) =>
    writeComment(target, COSTUME_MAGIC, { mappings }, "Palette Mapping", [80, 80, 320, 100]);

  const getCostumeKey = (c) => c?.name || c?.md5Ext || c?.md5 || c?.assetId;
  const getTarget = () => vm.editingTarget || runtime.getEditingTarget();
  const getCostume = (t) => t?.sprite?.costumes?.[t.currentCostume];

  const readCostumePaletteId = () => {
    const t = getTarget(),
      key = getCostumeKey(getCostume(t));
    return key ? loadMappings(t)[key] : null;
  };

  const writeCostumePaletteId = (paletteId) => {
    const t = getTarget(),
      key = getCostumeKey(getCostume(t));
    if (!t || !key || !paletteId) return;
    const mappings = loadMappings(t);
    mappings[key] = paletteId;
    writeMappings(t, mappings);
  };

  const renameCostumeMapping = (target, oldName, newName) => {
    if (!target || !oldName || !newName || oldName === newName) return;
    const mappings = loadMappings(target);
    if (!(oldName in mappings)) return;
    mappings[newName] = mappings[oldName];
    delete mappings[oldName];
    writeMappings(target, mappings);
  };

  const handleDeletePalette = async () => {
    const p = state.projectPalettes.find((p) => p.id === state.selectedPaletteId);
    if (!p) return;
    if (
      !(await addon.tab.confirm(msg("deletePalette"), `${msg("deletePaletteConfirm")}\n\n${p.name}`, {
        useEditorClasses: true,
      }))
    )
      return;

    state.projectPalettes = state.projectPalettes.filter((e) => e.id !== p.id);
    if (!state.projectPalettes.length)
      state.projectPalettes.push({
        id: `pal-${randomId()}`,
        name: `${msg("paletteTitle") || "Palette"} 1`,
        colors: [],
      });
    const fallbackId = state.projectPalettes[0].id;

    for (const t of runtime.targets || []) {
      const m = loadMappings(t);
      let dirty = false;
      for (const k of Object.keys(m))
        if (m[k] === p.id) {
          m[k] = fallbackId;
          dirty = true;
        }
      if (dirty) writeMappings(t, m);
    }

    Object.assign(state, {
      selectedPaletteId: fallbackId,
      palette: state.projectPalettes[0].colors,
      editingPaletteIndex: -1,
      selectedPaletteIndex: -1,
    });
    writeProjectComment(state.projectPalettes);
    writeCostumePaletteId(fallbackId);
    ui.renderSelector();
    ui.renderPalette();
    ui.updatePaletteSelection();
  };

  return {
    loadProjectPalettes,
    writeProjectComment,
    readCostumePaletteId,
    writeCostumePaletteId,
    renameCostumeMapping,
    loadMappings,
    writeMappings,
    handleDeletePalette,
    randomId,
  };
}
