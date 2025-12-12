const EMPTY_COSTUME_MD5 = "cd21514d0531fdffb22204e0ec5ed84a.svg";

async function canvasToAsset(storage, canvas) {
  const blob = await new Promise((r) => canvas.toBlob(r, "image/png"));
  const data = new Uint8Array(await blob.arrayBuffer());
  return storage.createAsset(storage.AssetType.ImageBitmap, storage.DataFormat.PNG, data, null, true);
}

async function halveAsset(storage, asset) {
  const img = await createImageBitmap(await (await fetch(asset.encodeDataURI())).blob());
  const w = img.width >> 1;
  const h = img.height >> 1;
  const canvas = Object.assign(document.createElement("canvas"), { width: w, height: h });
  canvas.getContext("2d").drawImage(img, 0, 0, w, h);
  return { asset: await canvasToAsset(storage, canvas), w, h };
}

function buildCostume(asset, costumeObj, extra = {}) {
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

export function wrapAddCostumeWait(addon, original, canvasAdjuster) {
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
      canvasAdjuster.enable(w, h, { fitView: true });
      return result;
    }

    if (ext === "svg") return original.call(this, md5ext, costumeObj, targetId, optId);

    // Pre-halve imported bitmaps (skip duplicates)
    const target = targetId ? this.runtime.getTargetById(targetId) : this.editingTarget;
    const isDuplicate = target?.getCostumes().some((c) => c.md5 === md5ext);
    if (!isDuplicate) {
      const loaded = costumeObj.asset || (await storage.load(storage.AssetType.ImageBitmap, md5ext.split(".")[0], ext));
      const { asset, w, h } = await halveAsset(storage, loaded);
      const costume = buildCostume(asset, costumeObj);
      const result = await original.call(this, costume.md5, costume, targetId, optId);
      canvasAdjuster.enable(w, h, { fitView: true });
      return result;
    }

    return original.call(this, md5ext, costumeObj, targetId, optId);
  };
}
