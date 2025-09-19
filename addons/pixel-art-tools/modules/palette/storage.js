const PALETTE_LIMIT = 64;
const PROJECT_COMMENT_MAGIC = " // _pixel_art_palette_project";
const COSTUME_COMMENT_MAGIC = " // _pixel_art_palette_costume";

export function createStorageModule(addon, vm, runtime, msg, state) {
  const randomId = () => Math.random().toString(36).slice(2, 10);

  const parseComment = (text, magic) => {
    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (trimmed.endsWith(magic)) {
        try {
          return JSON.parse(trimmed.slice(0, -magic.length));
        } catch { return null; }
      }
    }
    return null;
  };

  const serializeComment = (payload, magic, header) =>
    `${header ? header + "\n" : ""}${JSON.stringify(payload)}${magic}`;

  const findProjectComment = () =>
    Object.values(runtime.getTargetForStage()?.comments || {}).find(c => c.text?.includes(PROJECT_COMMENT_MAGIC));

  const sanitizeHex = (value) => {
    const trimmed = value?.toString().trim().replace(/^#/, "");
    return /^[0-9a-f]{6}$/i.test(trimmed) ? `#${trimmed.toUpperCase()}` : null;
  };

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

  const writeProjectComment = (projectPalettes) => {
    const s = runtime.getTargetForStage();
    if (!s) return;
    const snapshot = projectPalettes.map(p => ({ ...p, colors: p.colors.slice(0, PALETTE_LIMIT) }));
    const text = serializeComment({ palettes: snapshot }, PROJECT_COMMENT_MAGIC, "Scratch Addons Pixel Palette");
    const existing = findProjectComment();
    if (existing) existing.text = text;
    else s.createComment(randomId(), null, text, 60, 60, 360, 120, true);
    runtime.emitProjectChanged();
  };

  const loadMappings = (target) => {
    const mappings = {};
    Object.values(target?.comments || {}).forEach(comment => {
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
    const existing = Object.values(target.comments || {}).find(c => 
      c.text?.includes(COSTUME_COMMENT_MAGIC) && parseComment(c.text, COSTUME_COMMENT_MAGIC)?.mappings);
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

  const handleDeletePalette = async () => {
    const p = state.projectPalettes.find(p => p.id === state.selectedPaletteId);
    if (!p) return;
    const ok = await addon.tab.confirm(msg("deletePalette"), `${msg("deletePaletteConfirm")}\n\n${p.name}`, {useEditorClasses:true});
    if (!ok) return;

    const removedId = p.id;
    state.projectPalettes = state.projectPalettes.filter(e => e.id !== removedId);
    if (!state.projectPalettes.length) {
      state.projectPalettes.push({ id:`pal-${randomId()}`, name:`${msg("paletteTitle") || "Palette"} 1`, colors:[] });
    }
    const fallbackId = state.projectPalettes[0].id;

    for (const t of runtime.targets || []) {
      const m = loadMappings(t); let dirty = false;
      for (const k of Object.keys(m)) if (m[k] === removedId) { m[k] = fallbackId; dirty = true; }
      if (dirty) writeMappings(t, m);
    }

    Object.assign(state, {
      selectedPaletteId: fallbackId,
      palette: state.projectPalettes[0].colors,
      editingPaletteIndex: -1,
      selectedPaletteIndex: -1
    });
    writeProjectComment(state.projectPalettes);
    writeCostumePaletteId(fallbackId);
  };

  return {
    loadProjectPalettes,
    writeProjectComment,
    readCostumePaletteId,
    writeCostumePaletteId,
    loadMappings,
    writeMappings,
    handleDeletePalette,
    randomId
  };
}