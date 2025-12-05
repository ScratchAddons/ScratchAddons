let initialized = false;
let hasDynamicContextMenu = false;
let contextMenus = [];

const findParentWithProp = (reactInternalInstance, prop) => {
  if (!reactInternalInstance) return null;
  while (
    !reactInternalInstance.stateNode?.props ||
    !Object.prototype.hasOwnProperty.call(reactInternalInstance.stateNode.props, prop)
  ) {
    if (!reactInternalInstance.return) return null;
    reactInternalInstance = reactInternalInstance.return;
  }
  return reactInternalInstance.stateNode;
};
const findMonitor = (reactInternalInstance) => findParentWithProp(reactInternalInstance, "opcode");
const findSpriteSelectorItem = (reactInternalInstance) => findParentWithProp(reactInternalInstance, "dragType");

const setFocus = (item) => {
  item.setAttribute("data-highlighted", "");
  item.tabIndex = 0;
  item.focus();
};

const removeFocus = (item) => {
  item.removeAttribute("data-highlighted");
  item.tabIndex = -1;
};

const menuArrowKeyListener = (menu) => (e) => {
  if (e.target !== menu) {
    // Target is one of the items, not the menu
    return;
  }
  const moveFocusTo = (newFocusedItem) => {
    e.stopPropagation();
    setFocus(newFocusedItem);
  };
  if (["Home", "PageUp", "ArrowDown"].includes(e.key)) moveFocusTo(menu.firstElementChild);
  else if (["End", "PageDown", "ArrowUp"].includes(e.key)) moveFocusTo(menu.lastElementChild);
};

const itemArrowKeyListener = (menu, item) => (e) => {
  const moveFocusTo = (newFocusedItem) => {
    e.stopPropagation();
    removeFocus(item);
    setFocus(newFocusedItem);
  };
  if (e.key === "ArrowDown" && item.nextElementSibling) moveFocusTo(item.nextElementSibling);
  else if (e.key === "ArrowUp" && item.previousElementSibling) moveFocusTo(item.previousElementSibling);
  else if (["Home", "PageUp"].includes(e.key)) moveFocusTo(menu.firstElementChild);
  else if (["End", "PageDown"].includes(e.key)) moveFocusTo(menu.lastElementChild);
};

const onReactContextMenu = async function (e) {
  // This function expects "this" to be an addon.tab instance.

  if (!e.target) return;
  const ctxTarget = e.target.closest("[data-state]");
  if (!ctxTarget) return;
  let ctxMenu = await this.waitForElement("[data-radix-menu-content]");

  let type;
  const extra = {};
  if (ctxTarget.closest(".monitor-overlay")) {
    const props = findMonitor(ctxTarget[this.traps.getInternalKey(ctxTarget)]).props;
    if (!props) return;
    extra.monitorParams = props.params;
    extra.opcode = props.opcode;
    extra.itemId = props.id;
    extra.targetId = props.targetId;
    type = `monitor_${props.mode}`;
  } else if (findSpriteSelectorItem(ctxTarget[this.traps.getInternalKey(ctxTarget)])) {
    // SpriteSelectorItem which despite its name is used for costumes, sounds, backpacked script etc
    const props = findSpriteSelectorItem(ctxTarget[this.traps.getInternalKey(ctxTarget)]).props;
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

  // Allow arrow keys to move focus from existing menu items to those added by addons.
  // capture: true is needed so that stopPropagation() prevents the context menu library's
  // original listener from running.
  ctxMenu.addEventListener("keydown", menuArrowKeyListener(ctxMenu), { capture: true });
  for (const existing of ctxMenu.children) {
    existing.addEventListener("keydown", itemArrowKeyListener(ctxMenu, existing), { capture: true });
  }

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
    itemElem.role = "menuitem";
    itemElem.tabIndex = "-1";
    const label = document.createElement("span");
    label.textContent = item.label;
    itemElem.append(label);
    this.displayNoneWhileDisabled(itemElem);

    const onClick = (e) => {
      e.stopPropagation();
      document.dispatchEvent(new PointerEvent("pointerdown")); // close menu
      item.callback(ctx);
    };
    itemElem.addEventListener("click", onClick);

    itemElem.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        onClick(e);
      }
    });

    itemElem.addEventListener("mouseenter", () => setFocus(itemElem));
    itemElem.addEventListener("mouseleave", () => removeFocus(itemElem));
    itemElem.addEventListener("keydown", itemArrowKeyListener(ctxMenu, itemElem));

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
