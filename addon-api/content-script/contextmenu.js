let initialized = false;
let hasDynamicContextMenu = false;
let contextMenus = [];

const onReactContextMenu = function (e) {
  if (!e.target) return;
  const ctxTarget = e.target.closest(".react-contextmenu-wrapper");
  if (!ctxTarget) return;
  let ctxMenu = ctxTarget.querySelector("nav.react-contextmenu");
  let type;
  const extra = {};
  if (!ctxMenu && ctxTarget.closest(".monitor-overlay")) {
    // Monitors are rendered on document.body.
    // This is internal id which is different from the actual monitor ID.
    // Optional chain just to prevent crashes when they change the internal stuff.
    const mInternalId = ctxTarget[this.traps.getInternalKey(ctxTarget)]?.return?.stateNode?.props?.id;
    if (!mInternalId) return;
    ctxMenu = Array.prototype.find.call(
      document.querySelectorAll("body > nav.react-contextmenu"),
      (candidate) => candidate[this.traps.getInternalKey(candidate)]?.return?.stateNode?.props?.id === mInternalId
    );
    if (!ctxMenu) return;
    const props = ctxTarget[this.traps.getInternalKey(ctxTarget)]?.return?.return?.return?.stateNode?.props;
    if (!props) return;
    extra.monitorParams = props.params;
    extra.opcode = props.opcode;
    extra.itemId = props.id;
    extra.targetId = props.targetId;
    type = `monitor_${props.mode}`;
  } else if (ctxTarget[this.traps.getInternalKey(ctxTarget)]?.return?.return?.return?.stateNode?.props?.dragType) {
    // SpriteSelectorItem which despite its name is used for costumes, sounds, backpacked script etc
    const props = ctxTarget[this.traps.getInternalKey(ctxTarget)].return.return.return.stateNode.props;
    type = props.dragType.toLowerCase();
    extra.name = props.name;
    extra.itemId = props.id;
    extra.index = props.index;
  } else {
    return;
  }
  const ctx = {
    menuItem: ctxMenu,
    target: ctxTarget,
    type,
    ...extra,
  };
  Array.from(ctxMenu.children).forEach((existing) => {
    if (existing.classList.contains("sa-ctx-menu")) existing.remove();
  });
  for (const item of hasDynamicContextMenu
    ? contextMenus.flatMap((menu) => (typeof menu === "function" ? menu(type, ctx) : menu))
    : contextMenus) {
    if (!item) continue;
    if (item.types && !item.types.some((itemType) => type === itemType)) continue;
    if (item.condition && !item.condition(ctx)) continue;
    const itemElem = document.createElement("div");
    const classes = ["context-menu_menu-item"];
    if (item.border) classes.push("context-menu_menu-item-bordered");
    if (item.dangerous) classes.push("context-menu_menu-item-danger");
    itemElem.className = this.scratchClass(...classes, {
      others: ["react-contextmenu-item", "sa-ctx-menu", item.className || ""],
    });
    const label = document.createElement("span");
    label.textContent = item.label;
    itemElem.append(label);
    this.displayNoneWhileDisabled(itemElem);

    itemElem.addEventListener("click", (e) => {
      e.stopPropagation();
      window.dispatchEvent(
        new CustomEvent("REACT_CONTEXTMENU_HIDE", {
          detail: {
            action: "REACT_CONTEXTMENU_HIDE",
          },
        })
      );
      item.callback(ctx);
    });

    this.appendToSharedSpace({
      space: item.position,
      order: item.order,
      scope: ctxMenu,
      element: itemElem,
    });
  }
  return;
};

const initialize = (tab) => {
  if (initialized) return;
  initialized = true;
  tab
    .waitForElement("body")
    .then((body) => body.addEventListener("contextmenu", (e) => onReactContextMenu.call(tab, e), { capture: true }));
};

export const addContextMenu = (tab, callback, opts) => {
  if (typeof opts === "undefined") {
    contextMenus.push(callback);
    hasDynamicContextMenu = true;
  } else {
    contextMenus.push({
      ...opts,
      callback,
    });
  }
  initialize(tab);
};
