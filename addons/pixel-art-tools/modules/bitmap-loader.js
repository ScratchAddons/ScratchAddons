const EMPTY_COSTUME_MD5 = "cd21514d0531fdffb22204e0ec5ed84a.svg";

/** @typedef {import("./types.js").PixelArtState} PixelArtState */

async function canvasToAsset(storage, canvas) {
  const blob = await new Promise((r) => canvas.toBlob(r, "image/png"));
  const data = new Uint8Array(await blob.arrayBuffer());
  return storage.createAsset(storage.AssetType.ImageBitmap, storage.DataFormat.PNG, data, null, true);
}

async function halveAsset(storage, asset) {
  const img = await createImageBitmap(await (await fetch(asset.encodeDataURI())).blob());
  const w = img.width >> 1;
  const h = img.height >> 1;
  // Scratch bitmap costumes are stored at 2x resolution, so pre-halve imported
  // rasters here before creating the asset we hand back to the VM.
  const canvas = Object.assign(document.createElement("canvas"), { width: w, height: h });
  canvas.getContext("2d").drawImage(img, 0, 0, w, h);
  return { asset: await canvasToAsset(storage, canvas), w, h };
}

function buildCostume(asset, costumeObj, extra = {}) {
  // Rebuild imported/blank bitmaps as Scratch bitmapResolution:2 costumes so
  // they match the storage format pixel mode expects.
  return {
    ...costumeObj,
    asset,
    assetId: asset.assetId,
    dataFormat: asset.dataFormat,
    md5: `${asset.assetId}.${asset.dataFormat}`,
    bitmapResolution: 2,
    skinId: null,
    ...extra,
  };
}

/**
 * @param {PixelArtState} state
 */
export function wrapAddCostumeWait(addon, original, canvasAdjuster, state) {
  return async function (md5ext, costumeObj = {}, targetId, optId) {
    if (addon.self.disabled) return original.call(this, md5ext, costumeObj, targetId, optId);

    const storage = this.runtime.storage;
    const ext = md5ext.split(".").pop().toLowerCase();
    const isBlank = [md5ext, costumeObj.md5, costumeObj.md5ext].includes(EMPTY_COSTUME_MD5);

    // Create blank bitmap instead of empty SVG
    if (isBlank && !targetId && addon.settings.get("autoBitmap")) {
      const w = addon.settings.get("defaultWidth");
      const h = addon.settings.get("defaultHeight");
      const canvas = Object.assign(document.createElement("canvas"), { width: w, height: h });
      const asset = await canvasToAsset(storage, canvas);
      const costume = buildCostume(asset, costumeObj, { rotationCenterX: w / 2, rotationCenterY: h / 2 });
      const result = await original.call(this, costume.md5, costume, targetId, optId);
      if (state.enabled) {
        canvasAdjuster.enable(w, h, { fitView: true });
      }
      return result;
    }

    if (ext === "svg") return original.call(this, md5ext, costumeObj, targetId, optId);

    // Pre-halve imported bitmaps (skip duplicates)
    const target = targetId ? this.runtime.getTargetById(targetId) : this.editingTarget;
    const isDuplicate = target?.getCostumes().some((c) => c.md5 === md5ext);
    if (!isDuplicate) {
      // Resize once up front so the imported bitmap lands in the same resolution
      // scheme as new pixel-mode costumes instead of paying that conversion later.
      const loaded = costumeObj.asset || (await storage.load(storage.AssetType.ImageBitmap, md5ext.split(".")[0], ext));
      const { asset, w, h } = await halveAsset(storage, loaded);
      const costume = buildCostume(asset, costumeObj);
      const result = await original.call(this, costume.md5, costume, targetId, optId);
      if (state.enabled) {
        canvasAdjuster.enable(w, h, { fitView: true });
      }
      return result;
    }

    return original.call(this, md5ext, costumeObj, targetId, optId);
  };
}
