// Standalone HSV + alpha colour picker popup for the gradient stop editor.
// Has no imports — all external dependencies are injected via the constructor.
//
// new StopColorPicker({ msg, redux, triggerUndo, getCachedPaper, onClose })
//   msg(key)        — localised string lookup (returns the translated string)
//   redux           — addon.tab.redux (for eyedropper dispatch + state checks)
//   triggerUndo()   — commit an undo snapshot to scratch-paint's undo stack
//   getCachedPaper()— returns the current paper.js instance (required for eyedropper integration)
//   onClose()       — called by the picker on close to clear the SVG selection ring
//
// picker.open(color, onCommit, clientX, clientY)
//   color         — starting colour as any CSS string
//   onCommit(css) — called live on every change with the new CSS colour string

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// Parse "#rrggbb", "rgb(r,g,b)" or "rgba(r,g,b,a)" → [r,g,b,a] (a is 0–1), or null.
const parseColor = (c) => {
  if (!c || typeof c !== "string") return null;
  if (c.startsWith("#") && c.length >= 7)
    return [...[0, 1, 2].map((i) => parseInt(c.slice(1 + i * 2, 3 + i * 2), 16)), 1];
  const m = c.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/);
  return m ? [+m[1], +m[2], +m[3], m[4] !== undefined ? +m[4] : 1] : null;
};

export default class StopColorPicker {
  constructor({ msg, redux, triggerUndo, getCachedPaper, onClose }) {
    this._msg = msg;
    this._redux = redux;
    this._triggerUndo = triggerUndo;
    this._getCachedPaper = getCachedPaper;
    this._onClose = onClose;
  }

  // ── Colour math ─────────────────────────────────────────────────────────
  _rgbToHsv(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b),
      min = Math.min(r, g, b),
      d = max - min;
    let h = 0;
    if (d) {
      if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      else if (max === g) h = ((b - r) / d + 2) / 6;
      else h = ((r - g) / d + 4) / 6;
    }
    return [h * 360, max === 0 ? 0 : (d / max) * 100, max * 100];
  }

  _hsvToRgb(h, s, v) {
    h /= 360;
    s /= 100;
    v /= 100;
    const i = Math.floor(h * 6),
      f = h * 6 - i;
    const p = v * (1 - s),
      q = v * (1 - f * s),
      t = v * (1 - (1 - f) * s);
    return [
      [v, t, p],
      [q, v, p],
      [p, v, t],
      [p, q, v],
      [t, p, v],
      [v, p, q],
    ][i % 6].map((c) => Math.round(c * 255));
  }

  _h2(v) {
    return Math.round(clamp(v, 0, 255))
      .toString(16)
      .padStart(2, "0");
  }

  // ── Drag helper ──────────────────────────────────────────────────────────
  _makeDragTarget(el, onMove, onUp) {
    el.addEventListener("mousedown", (e) => {
      e.stopPropagation();
      onMove(e);
      const mv = (ev) => {
        ev.preventDefault();
        onMove(ev);
      };
      const up = () => {
        document.removeEventListener("mousemove", mv);
        document.removeEventListener("mouseup", up);
        onUp?.();
      };
      document.addEventListener("mousemove", mv);
      document.addEventListener("mouseup", up);
    });
  }

  // ── Bar factory (hue + alpha) ────────────────────────────────────────────
  _makeBar(marginTop, knobR) {
    const outer = document.createElement("div");
    outer.style.cssText = `position:relative;margin-top:${marginTop}px;margin-left:-${knobR}px;margin-right:-${knobR}px;height:18px;cursor:crosshair;`;
    const track = document.createElement("div");
    const trackInset = 2 * knobR;
    track.style.cssText = `position:absolute;top:3px;left:${trackInset}px;right:${trackInset}px;height:12px;border-radius:6px;pointer-events:none;`;
    const thumb = document.createElement("div");
    thumb.className = "sa-stop-picker-thumb";
    outer.append(track, thumb);
    return { outer, track, thumb };
  }

  // ── Open / reuse the picker panel ────────────────────────────────────────
  // color           — starting colour as any CSS string
  // onCommit(color) — called live on every change with the new CSS colour string
  open(color, onCommit, clientX, clientY) {
    const existing = document.querySelector(".sa-extra-stop-picker");
    if (existing?._setColor) {
      existing._setOnCommit(onCommit);
      existing._setColor(color);
      if (!existing._wasMoved) {
        existing.style.left = `${clamp(clientX - 10, 4, window.innerWidth - existing.offsetWidth - 4)}px`;
        existing.style.top = `${clamp(clientY + 28, 4, window.innerHeight - existing.offsetHeight - 4)}px`;
      }
      return;
    }
    existing?.remove();

    const p0 = parseColor(color) ?? [128, 128, 128, 1];
    const initHsv = this._rgbToHsv(p0[0], p0[1], p0[2]);
    let H = initHsv[0],
      S = initHsv[1],
      V = initHsv[2],
      A = (p0[3] ?? 1) * 100;

    const getCss = () => {
      const [r, g, b] = this._hsvToRgb(H, S, V);
      const a = +(A / 100).toFixed(3);
      return a >= 0.999 ? `#${this._h2(r)}${this._h2(g)}${this._h2(b)}` : `rgba(${r},${g},${b},${a})`;
    };
    let activeOnCommit = onCommit;
    const commit = () => activeOnCommit(getCss());

    // ── Panel shell ──────────────────────────────────────────────────────
    const CW = 200;
    const panel = document.createElement("div");
    panel.className = "sa-extra-stop-picker";
    panel.addEventListener("mousedown", (e) => e.stopPropagation());

    // ── Drag handle (title bar) ──────────────────────────────────────────
    const dragHandle = document.createElement("div");
    dragHandle.className = "sa-stop-picker-handle";
    const gripDots = document.createElement("div");
    gripDots.className = "sa-stop-picker-grip";
    for (let gi = 0; gi < 6; gi++) {
      const dot = document.createElement("div");
      dot.className = "sa-stop-picker-dot";
      gripDots.appendChild(dot);
    }
    dragHandle.appendChild(gripDots);
    dragHandle.addEventListener("mousedown", (e) => {
      e.stopPropagation();
      const startX = e.clientX,
        startY = e.clientY;
      const origLeft = parseInt(panel.style.left, 10) || 0;
      const origTop = parseInt(panel.style.top, 10) || 0;
      dragHandle.style.cursor = "grabbing";
      const mv = (ev) => {
        panel._wasMoved = true;
        panel.style.left = `${clamp(origLeft + ev.clientX - startX, 0, window.innerWidth - panel.offsetWidth)}px`;
        panel.style.top = `${clamp(origTop + ev.clientY - startY, 0, window.innerHeight - panel.offsetHeight)}px`;
      };
      const up = () => {
        document.removeEventListener("mousemove", mv);
        document.removeEventListener("mouseup", up);
        dragHandle.style.cursor = "grab";
      };
      document.addEventListener("mousemove", mv);
      document.addEventListener("mouseup", up);
    });

    // ── SV canvas ────────────────────────────────────────────────────────
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    const SV_H = 110;
    const svCanvas = document.createElement("canvas");
    svCanvas.width = CW * DPR;
    svCanvas.height = SV_H * DPR;
    svCanvas.className = "sa-stop-picker-sv";
    svCanvas.style.width = `${CW}px`;
    svCanvas.style.height = `${SV_H}px`;

    const drawSV = () => {
      const ctx = svCanvas.getContext("2d");
      const w = svCanvas.width,
        ch = svCanvas.height;
      ctx.fillStyle = `hsl(${H},100%,50%)`;
      ctx.fillRect(0, 0, w, ch);
      const wg = ctx.createLinearGradient(0, 0, w, 0);
      wg.addColorStop(0, "rgba(255,255,255,1)");
      wg.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = wg;
      ctx.fillRect(0, 0, w, ch);
      const bk = ctx.createLinearGradient(0, 0, 0, ch);
      bk.addColorStop(0, "rgba(0,0,0,0)");
      bk.addColorStop(1, "rgba(0,0,0,1)");
      ctx.fillStyle = bk;
      ctx.fillRect(0, 0, w, ch);
      const cx = (S / 100) * w,
        cy = (1 - V / 100) * ch;
      ctx.beginPath();
      ctx.arc(cx, cy, 6 * DPR, 0, Math.PI * 2);
      ctx.strokeStyle = "white";
      ctx.lineWidth = 2 * DPR;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy, 5 * DPR, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(0,0,0,0.4)";
      ctx.lineWidth = 1 * DPR;
      ctx.stroke();
    };
    this._makeDragTarget(
      svCanvas,
      (e) => {
        const r = svCanvas.getBoundingClientRect();
        S = clamp((e.clientX - r.left) / r.width, 0, 1) * 100;
        V = clamp(1 - (e.clientY - r.top) / r.height, 0, 1) * 100;
        drawSV();
        syncPickers();
        commit();
      },
      () => this._triggerUndo()
    );

    // ── Shared bar factory (hue + alpha) ─────────────────────────────────
    const KNOB_R = 9;
    const TRACK_W = CW - 2 * KNOB_R;

    // ── Hue bar ──────────────────────────────────────────────────────────
    const { outer: hueOuter, track: hueTrack, thumb: hueThumb } = this._makeBar(8, KNOB_R);
    hueTrack.style.background =
      "linear-gradient(to right,hsl(0,100%,50%),hsl(60,100%,50%)," +
      "hsl(120,100%,50%),hsl(180,100%,50%),hsl(240,100%,50%),hsl(300,100%,50%),hsl(360,100%,50%))";
    this._makeDragTarget(
      hueOuter,
      (e) => {
        const r = hueOuter.getBoundingClientRect();
        H = clamp((e.clientX - r.left - 2 * KNOB_R) / TRACK_W, 0, 1) * 360;
        drawSV();
        syncPickers();
        commit();
      },
      () => this._triggerUndo()
    );

    // ── Alpha bar ────────────────────────────────────────────────────────
    const { outer: alphaOuter, track: alphaTrack, thumb: alphaThumb } = this._makeBar(6, KNOB_R);
    const CHECKER =
      "linear-gradient(45deg,#888 25%,transparent 25%),linear-gradient(-45deg,#888 25%,transparent 25%)," +
      "linear-gradient(45deg,transparent 75%,#888 75%),linear-gradient(-45deg,transparent 75%,#888 75%)";
    Object.assign(alphaTrack.style, {
      backgroundImage: CHECKER,
      backgroundSize: "8px 8px",
      backgroundPosition: "0 0,0 4px,4px -4px,-4px 0",
      backgroundColor: "#ccc",
    });
    const alphaFill = document.createElement("div");
    alphaFill.className = "sa-stop-picker-alpha-fill";
    alphaTrack.appendChild(alphaFill);

    const updateAlphaBar = () => {
      const [r, g, b] = this._hsvToRgb(H, S, V);
      alphaFill.style.background = `linear-gradient(to right,rgba(${r},${g},${b},0),rgb(${r},${g},${b}))`;
      alphaThumb.style.left = `${2 * KNOB_R + (A / 100) * TRACK_W}px`;
    };
    this._makeDragTarget(
      alphaOuter,
      (e) => {
        const r = alphaOuter.getBoundingClientRect();
        A = clamp((e.clientX - r.left - 2 * KNOB_R) / TRACK_W, 0, 1) * 100;
        syncPickers();
        commit();
      },
      () => this._triggerUndo()
    );

    // ── Bottom row (preview swatch + hex + alpha %) ───────────────────────
    const bottomRow = document.createElement("div");
    bottomRow.className = "sa-stop-picker-bottom-row";

    const swatchWrap = document.createElement("div");
    swatchWrap.className = "sa-stop-picker-swatch";
    swatchWrap.style.backgroundImage = CHECKER;
    swatchWrap.style.backgroundSize = "8px 8px";
    swatchWrap.style.backgroundPosition = "0 0,0 4px,4px -4px,-4px 0";
    swatchWrap.style.backgroundColor = "#ccc";
    const swatchFill = document.createElement("div");
    swatchFill.className = "sa-stop-picker-swatch-fill";
    swatchWrap.appendChild(swatchFill);

    const hexInp = document.createElement("input");
    hexInp.type = "text";
    hexInp.maxLength = 7;
    hexInp.className = "sa-stop-picker-input sa-stop-picker-hex";
    hexInp.addEventListener("mousedown", (e) => e.stopPropagation());

    const aLabel = document.createElement("span");
    aLabel.textContent = "A:";
    aLabel.className = "sa-stop-picker-alpha-label";

    const alphaInp = document.createElement("input");
    alphaInp.type = "text";
    alphaInp.className = "sa-stop-picker-input sa-stop-picker-alpha-input";
    alphaInp.addEventListener("mousedown", (e) => e.stopPropagation());

    // ── Eyedropper button ────────────────────────────────────────────────
    // Hooks into Scratch's own EyeDropperTool via Redux — no pixel-sampling code needed.
    const eyeDropperBtn = document.createElement("button");
    eyeDropperBtn.title = this._msg("pick-color");
    eyeDropperBtn.className = "sa-stop-picker-eyedropper";
    eyeDropperBtn.innerHTML =
      `<svg width="14" height="14" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">` +
      `<path fill="currentColor" d="M9.153 12.482c-.12.136-.274.222-.546.29-.7.154-1.365.784-1.57 1.483-.068.22-.29.459-.529.579L4.735 15.67c-.085.034-.154.052-.188.052l-.273-.256c0-.017 0-.085.051-.205l.836-1.79c.103-.22.342-.443.581-.511.7-.22 1.331-.869 1.518-1.721.034-.136.12-.272.24-.41L11.44 6.908l1.654 1.654-3.94 3.92zM16.608 5.289c.256-.256.392-.614.392-.955s-.136-.683-.392-.938c-.529-.529-1.365-.529-1.893 0l-1.484 1.483-.171-.171-.546-.545c-.341-.34-.904-.34-1.245 0l-.665.648c-.324.34-.341.835-.051 1.176L6.595 9.925c-.29.307-.494.665-.614 1.176-.051.256-.341.546-.614.631-.562.17-1.108.648-1.364 1.21l-.835 1.773c-.273.597-.205 1.21.17 1.603l.342.34c.222.222.529.341.87.341.222 0 .477-.068.716-.17l1.791-.836c.563-.272 1.041-.801 1.211-1.364.069-.272.376-.562.785-.648.359-.085.717-.29 1.007-.596l3.957-3.932c.341.29.853.256 1.16-.068l.665-.648c.341-.341.341-.904 0-1.245l-.58-.58-.136-.136 1.484-1.484z"/>` +
      `</svg>`;
    eyeDropperBtn.addEventListener("mousedown", (e) => e.stopPropagation());
    eyeDropperBtn.addEventListener("click", () => {
      // Fade the panel so user can see the canvas, but keep it in the DOM.
      panel.style.opacity = "0.15";
      panel.style.pointerEvents = "none";
      this._redux.dispatch({
        type: "scratch-paint/eye-dropper/ACTIVATE_COLOR_PICKER",
        callback: (hexString) => {
          const c = parseColor(hexString);
          if (c) {
            [H, S, V] = this._rgbToHsv(c[0], c[1], c[2]);
            // Eyedropper samples rendered canvas pixels — always opaque. Leave A unchanged.
          }
          drawSV();
          syncPickers();
          commit();
          this._triggerUndo();
        },
        previousMode: this._getCachedPaper()?.tool ?? null,
      });
      // Restore panel after any mouseup (pick or cancel — both end the dropper session).
      document.addEventListener(
        "mouseup",
        () => {
          panel.style.opacity = "";
          panel.style.pointerEvents = "";
        },
        { once: true, capture: true }
      );
    });

    bottomRow.append(swatchWrap, hexInp, aLabel, alphaInp, eyeDropperBtn);

    // syncPickers: push current H/S/V/A into all UI widgets.
    const syncPickers = () => {
      const [r, g, b] = this._hsvToRgb(H, S, V);
      hexInp.value = `#${this._h2(r)}${this._h2(g)}${this._h2(b)}`;
      alphaInp.value = `${Math.round(A)}%`;
      hueThumb.style.left = `${2 * KNOB_R + (H / 360) * TRACK_W}px`;
      updateAlphaBar();
      swatchFill.style.background = getCss();
    };

    hexInp.addEventListener("change", () => {
      const c = parseColor(hexInp.value.trim());
      if (c) {
        [H, S, V] = this._rgbToHsv(c[0], c[1], c[2]);
        drawSV();
        syncPickers();
        commit();
        this._triggerUndo();
      }
    });
    hexInp.addEventListener("keydown", (e) => {
      if (e.key === "Enter") hexInp.dispatchEvent(new Event("change"));
    });

    alphaInp.addEventListener("change", () => {
      const v = parseFloat(alphaInp.value);
      if (!isNaN(v)) {
        A = clamp(v, 0, 100);
        syncPickers();
        commit();
        this._triggerUndo();
      }
    });
    alphaInp.addEventListener("keydown", (e) => {
      if (e.key === "Enter") alphaInp.dispatchEvent(new Event("change"));
    });

    // ── Assemble ─────────────────────────────────────────────────────────
    panel.append(dragHandle, svCanvas, hueOuter, alphaOuter, bottomRow);
    document.body.appendChild(panel);
    drawSV();
    syncPickers();

    // Expose updaters so open() can reuse this panel for a different stop.
    panel._setOnCommit = (fn) => {
      activeOnCommit = fn;
    };
    panel._setColor = (css) => {
      const c = parseColor(css) ?? [128, 128, 128, 1];
      [H, S, V] = this._rgbToHsv(c[0], c[1], c[2]);
      A = (c[3] ?? 1) * 100;
      drawSV();
      syncPickers();
    };
    // Programmatic close used when the active node is deleted.
    panel._close = () => {
      this._onClose();
      panel.remove();
      document.removeEventListener("mousedown", closeOnOutside, true);
    };

    // Position below + right of cursor, clamped inside viewport.
    const pr = panel.getBoundingClientRect();
    panel.style.left = `${clamp(clientX - 10, 4, window.innerWidth - CW - 24)}px`;
    panel.style.top = `${clamp(clientY + 28, 4, window.innerHeight - pr.height - 4)}px`;

    // Non-modal close: capture-phase listener on every mousedown.
    // · Click inside the picker panel  → return, picker interaction works normally.
    // · Click on a gradient handle (.sa-grad-overlay) → do NOT remove the panel; let the
    //   event through so the handle's click handler calls open(), which will find this
    //   panel via _setColor and swap the colour without rebuilding or repositioning.
    // · Click on empty space → stopPropagation (keep fill popup open) + remove panel.
    const closeOnOutside = (e) => {
      // While Scratch's eyedropper is active, don't close or stop the mousedown —
      // stopping propagation here prevents paper.js from receiving the event, which
      // keeps hideLoupe=true and causes the dropper callback to be skipped entirely.
      if (this._redux.state?.scratchPaint?.color?.eyeDropper?.active) return;
      if (panel.contains(e.target)) return;
      const overlay = document.querySelector(".sa-grad-overlay");
      if (overlay?.contains(e.target)) return; // handle click — let event through, keep panel
      e.stopPropagation();
      this._onClose();
      panel.remove();
      document.removeEventListener("mousedown", closeOnOutside, true);
    };
    setTimeout(() => document.addEventListener("mousedown", closeOnOutside, true), 150);
  }
}
