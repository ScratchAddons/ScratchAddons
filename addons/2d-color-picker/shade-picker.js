const SLIDER_PADDING = 11;
const SLIDER_SIZE = 150 - 2 * SLIDER_PADDING;

export default class ShadePicker extends EventTarget {
  constructor(addon, msg) {
    super();

    this.addon = addon;
    this.msg = msg;

    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);

    this.keyPressed = null;
    this.originalHandlePos = { x: 0, y: 0 };
    this.originalMousePos = { x: 0, y: 0 };
    window.addEventListener("keydown", (e) => (this.keyPressed = e.key));
    window.addEventListener("keyup", () => (this.keyPressed = null));
  }

  createElements(defaultColor) {
    // create the color picker element and all it's child elements
    const addon = this.addon;
    const msg = this.msg;

    this.slider = document.createElement("div");
    this.slider.className = "sa-2dcolor-picker";
    this.slider.style.background = "#" + this.convertToGeneralColor(defaultColor.h);

    const sliderImage = Object.assign(document.createElement("img"), {
      className: "sa-2dcolor-picker-image",
      src: addon.self.dir + "/assets/sv-gradient.svg",
      draggable: false,
    });
    this.handle = Object.assign(document.createElement("div"), {
      className: addon.tab.scratchClass("slider_handle"),
    });
    this.handle.style.pointerEvents = "none";

    // create the label
    const label = document.createElement("div");
    label.className = addon.tab.scratchClass("color-picker_row-header", { others: "sa-2dcolor-label" });
    const labelName = document.createElement("span");
    labelName.className = addon.tab.scratchClass("color-picker_label-name", { others: "sa-2dcolor-label-name" });
    labelName.innerText = msg("shade");
    this.labelVal = document.createElement("span");
    this.labelVal.className = addon.tab.scratchClass("color-picker_label-readout", {
      others: "sa-2dcolor-label-val",
    });
    label.appendChild(labelName);
    label.appendChild(this.labelVal);
    addon.tab.displayNoneWhileDisabled(label);

    this.setShade(defaultColor.s, defaultColor.v);

    this.slider.addEventListener("pointerdown", (e) => {
      e.preventDefault();

      if (e.target === this.handle) {
        this.originalHandlePos = {
          x: parseFloat(this.handle.style.left),
          y: parseFloat(this.handle.style.top),
        };
      } else {
        // Drag started outside handle
        // Move handle to mouse position first
        this.originalHandlePos = {
          x: Math.min(Math.max(e.clientX - this.slider.getBoundingClientRect().x - SLIDER_PADDING, 0), SLIDER_SIZE),
          y: Math.min(Math.max(e.clientY - this.slider.getBoundingClientRect().y - SLIDER_PADDING, 0), SLIDER_SIZE),
        };
      }
      this.originalMousePos = {
        x: e.clientX,
        y: e.clientY,
      }

      this.onDrag(e);

      window.addEventListener("pointermove", this.onMouseMove);
      window.addEventListener("pointerup", this.onMouseUp);
    });

    this.slider.appendChild(sliderImage);
    this.slider.appendChild(this.handle);
    addon.tab.displayNoneWhileDisabled(this.slider);

    return [this.slider, label];
  }

  // for the color picker's background color
  convertToGeneralColor(h) {
    return tinycolor({ h, s: 1, v: 1 }).toHex();
  };

  setColor({ h, s, v }) {
    this.setShade(s, v);
    this.slider.style.background = "#" + this.convertToGeneralColor(h);
  }

  setShade(s, v) {
    this.handle.style.left = s * SLIDER_SIZE + "px";
    this.handle.style.top = (1 - v) * SLIDER_SIZE + "px";
    this.labelVal.innerText = `${Math.round(s * 100)}, ${Math.round(v * 100)}`;
  }

  onDrag(e) {
    let dx = e.clientX - this.originalMousePos.x;
    let dy = e.clientY - this.originalMousePos.y;
    let newHandleX = Math.min(Math.max(this.originalHandlePos.x + dx, 0), SLIDER_SIZE);
    let newHandleY = Math.min(Math.max(this.originalHandlePos.y + dy, 0), SLIDER_SIZE);
    if (this.keyPressed === "Shift") {
      if (Math.abs(dx) > Math.abs(dy)) newHandleY = this.originalHandlePos.y;
      else newHandleX = this.originalHandlePos.x;
    }

    let s = newHandleX / SLIDER_SIZE;
    let v = 1 - newHandleY / SLIDER_SIZE;
    this.dispatchEvent(new CustomEvent("change", { detail: { s, v } }));

    this.setShade(s, v);
  }

  onMouseMove(e) {
    this.onDrag(e);
    return false;
  }

  onMouseUp(e) {
    window.removeEventListener("pointermove", this.onMouseMove);
    window.removeEventListener("pointerup", this.onMouseUp);
  }
}
