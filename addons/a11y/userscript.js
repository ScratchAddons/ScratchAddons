let wrap, vm, addon, safeMsg, msg;
let a11yObjects = {};
let getTabNav = function getTabNav() {
  return false;
};

function makeWrap() {
  wrap = document.createElement("div");
  wrap.id = "aria-container";
  let canvas = document.querySelector(
    '[class*="stage_stage-wrapper_"] [class*="stage_stage_"][class*="box_box_"] canvas'
  );
  canvas.insertAdjacentElement("beforeBegin", wrap);
  function pass2canvas(e) {
    let o = {
      touches: e.touches,
      clientX: e.clientX,
      clientY: e.clientY,
      changedTouches: e.changedTouches,
      deltaX: e.deltaX,
      deltaY: e.deltaY,
    };
    canvas.dispatchEvent(new e.constructor(e.type, o));
  }
  wrap.addEventListener("mousedown", pass2canvas);
  wrap.addEventListener("touchstart", pass2canvas);
  wrap.addEventListener("wheel", pass2canvas);
}

function cleanUp() {
  let targets = vm.runtime.targets.map((e) => e.id);
  targets.forEach((e) => {
    a11yObjects[e] = a11yObjects[e] || {};
  });
  Object.keys(a11yObjects)
    .filter((e) => !targets.includes(e))
    .forEach((e) => {
      a11yObjects[e].ele.remove();
      delete a11yObjects[e];
    });
}

export default async function (o) {
  const { global, addon, safeMsg, msg, console } = o;
  async function ensureWrap() {
    while (true) {
      await addon.tab.waitForElement('[class*="stage_stage-wrapper_"] [class*="stage_stage_"][class*="box_box_"]', {
        markAsSeen: true,
      });
      makeWrap();
    }
  }
  function updateAria(target) {
    if (!wrap) return;
    if (!target.visible) {
      if (a11yObjects[target.id]) {
        if (a11yObjects[target.id].ele) a11yObjects[target.id].ele.remove();
      }
      return;
    }
    a11yObjects[target.id] = a11yObjects[target.id] || {};
    if (!a11yObjects[target.id].ele || (a11yObjects[target.id].ele && !a11yObjects[target.id].ele.isConnected)) {
      a11yObjects[target.id].ele = document.createElement("div");
      a11yObjects[target.id].ele.className = "aria-item";
      a11yObjects[target.id].ele.dataset.spriteId = target.id;
      wrap.append(a11yObjects[target.id].ele);
    }
    if (getTabNav()) {
      a11yObjects[target.id].ele.setAttribute("tabindex", "0");
    } else {
      a11yObjects[target.id].ele.removeAttribute("tabindex");
    }
    let bounds = target.renderer.getBounds(target.drawableID);
    a11yObjects[target.id].ele.style.setProperty("--aria-bounds-width", bounds.width);
    a11yObjects[target.id].ele.style.setProperty("--aria-bounds-height", bounds.height);
    a11yObjects[target.id].ele.style.setProperty("--aria-bounds-top", bounds.top);
    a11yObjects[target.id].ele.style.setProperty("--aria-bounds-left", bounds.left);
    if (a11yObjects[target.id].role) {
      a11yObjects[target.id].ele.setAttribute("role", a11yObjects[target.id].role);
    } else {
      a11yObjects[target.id].ele.removeAttribute("role");
    }
    let bubbleMessage = "";
    let state = target.getCustomState("Scratch.looks");
    if (state) {
      if (state.text && state.text.trim()) {
        bubbleMessage = msg(state.type + "Bubble", { text: state.text.trim() });
      }
    }
    if (a11yObjects[target.id].label || bubbleMessage) {
      a11yObjects[target.id].ele.setAttribute(
        "aria-label",
        a11yObjects[target.id].label ? a11yObjects[target.id].label + " " + bubbleMessage : bubbleMessage
      );
    } else {
      a11yObjects[target.id].ele.removeAttribute("aria-label");
    }
  }
  async function renderLoop() {
    while (true) {
      cleanUp();
      for (let e in a11yObjects) {
        updateAria(vm.runtime.targets.find((a) => a.id === e));
      }
      await new Promise((cb) => requestAnimationFrame((_) => cb()));
    }
  }

  getTabNav = function getTabNav() {
    return o.addon.settings.get("tabNav");
  };
  console.log("a11y support enabled");
  vm = addon.tab.traps.vm;
  ensureWrap();
  renderLoop();
  addon.tab.addBlock("set sprite aria role to %s", ["role"], ({ role }, target) => {
    a11yObjects[target] = a11yObjects[target] || {};
    a11yObjects[target].role = role;
  });
  addon.tab.addBlock("set sprite label to %s", ["label"], ({ label }, target) => {
    a11yObjects[target] = a11yObjects[target] || {};
    a11yObjects[target].label = label;
  });
}
