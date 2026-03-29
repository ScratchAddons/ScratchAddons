const PALETTE_LIMIT = 64;

const hex = (r, g, b) => `#${((r << 16) | (g << 8) | b).toString(16).toUpperCase().padStart(6, "0")}`;
const distSq = (h1, h2) => {
  const r1 = parseInt(h1.slice(1, 3), 16),
    g1 = parseInt(h1.slice(3, 5), 16),
    b1 = parseInt(h1.slice(5, 7), 16);
  const r2 = parseInt(h2.slice(1, 3), 16),
    g2 = parseInt(h2.slice(3, 5), 16),
    b2 = parseInt(h2.slice(5, 7), 16);
  const dr = r2 - r1,
    dg = g2 - g1,
    db = b2 - b1;
  return dr * dr + dg * dg + db * db;
};

export const parseGPL = (text) => {
  const out = [];
  for (const line of text.split(/\r?\n/)) {
    if (!line || line[0] === "#" || !/\d/.test(line)) continue;
    const p = line.trim().split(/\s+/);
    if (p.length < 3) continue;
    const r = +p[0],
      g = +p[1],
      b = +p[2];
    if ([r, g, b].some(Number.isNaN)) continue;
    const h = hex(r & 255, g & 255, b & 255);
    if (!out.includes(h)) out.push(h);
    if (out.length >= PALETTE_LIMIT) break;
  }
  return out;
};

export const parseTXT = (text) => {
  const out = [];
  const re = /#?([0-9A-Fa-f]{6})\b/g;
  let m;
  while ((m = re.exec(text)) && out.length < PALETTE_LIMIT) {
    const h = `#${m[1].toUpperCase()}`;
    if (!out.includes(h)) out.push(h);
  }
  return out;
};

const extractImageColors = (imageData, { threshold = 20, stride = 4, quantBits = 5, alphaMin = 128, limit } = {}) => {
  const { data } = imageData,
    qShift = 8 - quantBits;
  const counts = new Map(),
    rep = new Map();
  for (let i = 0; i < data.length; i += 4 * stride) {
    if (data[i + 3] < alphaMin) continue;
    const r = data[i],
      g = data[i + 1],
      b = data[i + 2];
    const key = ((r >> qShift) << 16) | ((g >> qShift) << 8) | (b >> qShift);
    counts.set(key, (counts.get(key) || 0) + 1);
    if (!rep.has(key)) rep.set(key, { r, g, b });
  }
  const buckets = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const res = [],
    thr = threshold * threshold;
  for (let i = 0; i < buckets.length && res.length < limit; i++) {
    const { r, g, b } = rep.get(buckets[i][0]);
    const h = hex(r, g, b);
    let ok = true;
    for (let j = 0; j < res.length; j++) {
      if (distSq(h, res[j]) < thr) {
        ok = false;
        break;
      }
    }
    if (ok) res.push(h);
  }
  return res;
};

export const parseImage = (file) => {
  const opts = { threshold: 20, stride: 1, quantBits: 5, alphaMin: 128, limit: PALETTE_LIMIT };
  const draw = (bitmap) => {
    const canvas =
      typeof OffscreenCanvas !== "undefined"
        ? new OffscreenCanvas(bitmap.width, bitmap.height)
        : Object.assign(document.createElement("canvas"), { width: bitmap.width, height: bitmap.height });
    const context = canvas.getContext("2d", { willReadFrequently: true });
    context.drawImage(bitmap, 0, 0);
    return extractImageColors(context.getImageData(0, 0, bitmap.width, bitmap.height), opts);
  };

  if ("createImageBitmap" in window) {
    return createImageBitmap(file, { colorSpaceConversion: "none", premultiplyAlpha: "none" }).then(draw);
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        resolve(draw(img));
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};

export const createExportTXT = (state) => () => {
  const palette = state.projectPalettes.find((entry) => entry.id === state.selectedPaletteId);
  if (!palette || !palette.colors.length) return;
  const text = palette.colors.map((h) => h.slice(1)).join(",");
  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "pixel-palette.txt";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
};

export function createImportExportModule(state) {
  return {
    parseGPL,
    parseTXT,
    parseImage,
    exportTXT: createExportTXT(state),
  };
}
