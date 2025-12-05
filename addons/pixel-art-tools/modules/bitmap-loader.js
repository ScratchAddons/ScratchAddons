import { assetSelect } from "../../asset-conflict-dialog/utils.js";

// Flag set when vm.addCostume is called (new import), not set for duplicates
let isNewImport = false;

async function halveAsset(asset) {
  const img = await createImageBitmap(await (await fetch(asset.encodeDataURI())).blob());
  const c = Object.assign(document.createElement("canvas"), {
    width: img.width >> 1,
    height: img.height >> 1,
  });
  c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
  const b = await new Promise((r) => c.toBlob(r, "image/png"));
  const buff = await b.arrayBuffer();
  asset.setData(new Uint8Array(buff), "png", true);
}

export function wrapCreateBitmapSkin(runtime, createBitmapSkin) {
  return function (canvas, bitmapResolution, center) {
    // Only halve for new imports (via vm.addCostume), not duplicates
    if (isNewImport) {
      canvas = runtime.v2BitmapAdapter.resize(canvas, canvas.width / 2, canvas.height / 2);
    }
    return createBitmapSkin.call(this, canvas, bitmapResolution, center);
  };
}

export function wrapAddCostumeWait(addon, originalAddCostume) {
  return async function (...args) {
    const targetId = args[2];
    const target = targetId ? this.runtime.getTargetById(targetId) : this.editingTarget;

    // Track existing asset IDs to detect duplicates
    const existingAssetIds = new Set(
      target
        .getCostumes()
        .map((c) => c.asset?.assetId)
        .filter(Boolean)
    );

    // Set flag so wrapCreateBitmapSkin knows this is a new import
    isNewImport = true;
    const out = await originalAddCostume.call(this, ...args);
    isNewImport = false;

    const idx = target.currentCostume;
    const asset = target.getCostumes()[idx].asset;

    // only apply this modification to bitmaps
    if (asset.dataFormat == "svg") {
      if (!args[2] && addon.settings.get("autoBitmap")) {
        // if we are creating a new costume then we will automatically convert to a bitmap for the user
        // but we need a timeout, or the click will apply to the current costume
        setTimeout(() => document.querySelectorAll("[class*='paint-editor_bitmap-button_']")[0].click(), 100);
      }
      return out;
    }

    // Skip halving for duplicates (asset already existed)
    if (existingAssetIds.has(asset.assetId)) {
      return out;
    }

    // Scratch will use bitmapResolution = 2 which resizes our canvas so we are going to halve it to fix this
    // but we'll keep it at bitmapResolution = 2, so that scratch doesn't resize it again the next time the project loads
    await halveAsset(asset);

    // need to update assetId and md5 to be in sync with the modified asset, or scratch will revert changes on save.
    const costume = target.sprite?.costumes_[idx];
    costume.assetId = costume.asset.assetId;
    costume.md5 = `${costume.assetId}.${costume.asset.dataFormat}`;

    // scratch won't update visuals until we change costume in the gui.
    assetSelect(addon, idx - 1, "costume");
    setTimeout(() => {assetSelect(addon, idx, "costume");});
  };
}
