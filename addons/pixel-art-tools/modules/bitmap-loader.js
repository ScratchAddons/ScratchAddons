import { assetSelect } from "../../asset-conflict-dialog/utils.js";

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
    // keep existing conflict modal behavior etc
    bitmapResolution = 1;
    canvas = runtime.v2BitmapAdapter.resize(canvas, canvas.width / 2, canvas.height / 2);
    return createBitmapSkin.call(this, canvas, bitmapResolution, center);
  };
}

export function wrapGetSkinSize(getSkinSize) {
  return function (...args) {
    const size = getSkinSize.call(this, ...args);
    return [size[0] / 2, size[1] / 2];
  };
}

export function wrapAddCostumeWait(addon, originalAddCostume) {
  return async function (...args) {
    const out = await originalAddCostume.call(this, ...args);

    const target = this.runtime.getTargetById(args[2]);
    const idx = target.currentCostume;
    const asset = target.getCostumes()[idx].asset;
    await halveAsset(asset);

    const costume = target.sprite?.costumes_[idx];
    costume.size = [costume.size[0] / 2, costume.size[1] / 2];
    costume.bitmapResolution = 1;
    costume.rotationCenterX = costume.rotationCenterX / 2;
    costume.rotationCenterY = costume.rotationCenterY / 2;
    assetSelect(addon, idx - 1, "costume");
    assetSelect(addon, idx, "costume");
  };
}

export function wrapUpdateBitmap(originalUpdateBitmap) {
  return function (...args) {
    args[args.length - 1] = 1;
    return originalUpdateBitmap.call(this, ...args);
  };
}

export function wrapGetCostume(originalGetCostume) {
  return function (...args) {
    return originalGetCostume.call(this, ...args);
  };
}
