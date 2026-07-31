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

const menuExpander = document.createElement("img");
menuExpander.setAttribute(
  "src",
  "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB3aWR0aD0iOHB4IiBoZWlnaHQ9IjVweCIgdmlld0JveD0iMCAwIDggNSIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnh0bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayI+CiAgICA8IS0tIEdlbmVyYXRvciogU2tldGNoIDQ4LjIgKDQ3MzI3KSAtIGh0dHA6Ly93d3cuYm9oZW1pYW5jb2RpbmcuY29tL3NrZXRjaCAtLT4KICAgIDx0aXRsZT5kcm9wZG93bi1jYXJldDwvdGl0bGU+CiAgICA8ZGVzYz5DcmVhdGVkIHdpdGggU2tldGNoLjwvZGVzYz4KICAgIDxkZWZzPjwvZGVmcz4KICAgIDxnIGlkPSJQYWdlLTEiIHN0cm9rZT0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIxIiBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPgogICAgICAgIDxnIGlkPSJkcm9wZG93bi1jYXJldCIgZmlsbD0iIzAwMDAwMCI+CiAgICAgICAgICAgIDxwYXRoIGQ9Ik00LDUgQzMuNzI1MjA3MDgsNSAzLjQ1MTYzMDA2LDQuODk2OTUwNDUgMy4yNDEyNzk3Myw0LjY4OTY1MzExIEwwLjMxNDYxMzU3MiwxLjgwNjY2MjI3IEMtMC4xMDQ4NzExOTEsMS4zOTMyNjU4MyAtMC4xMDQ4NzExOTEsMC43MjQ2NDIwMjMgMC4zMTQ2MTM1NzIsMC4zMTAwNDczMzEgQzAuNzMyODgyNDM4LC0wLjEwMzM0OTExIDcuMjY3MTE3NTYsLTAuMTAzMzQ5MTEgNy42ODUzODY0MywwLjMxMDA0NzMzMSBDOC4xMDQ4NzExOSwwLjcyMzQ0Mzc3MiA4LjEwNDg3MTE5LDEuMzkzMjY1ODMgNy42ODUzODY0MywxLjgwNjY2MjI3IEw0Ljc1OTkzNjE3LDQuNjg5NjUzMTEgQzQuNTQ5NTg1ODMsNC44OTY5NTA0NSA0LjI3NjAwODgyLDUgNCw1Ij48L3BhdGg+CiAgICAgICAgPC9nPgogICAgPC9nPgo8L3N2Zz4="
);
menuExpander.setAttribute("aria-hidden", "true");
menuExpander.style.margin = "0 5px";
menuExpander.style.pointerEvents = "none";
menuExpander.style.transform = "rotate(-90deg)";

const resolveContextMenuItems = (items, type, ctx) => {
  return items.flatMap((menu) => (typeof menu === "function" ? menu(type, ctx) : menu));
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

  const renderMenuItems = (items, container, parentItemElem = null, level = 0) => {
    container.style.overflow = "visible";
    for (const item of items) {
      if (!item) continue;
      if (item.types && !item.types.some((itemType) => type === itemType)) continue;
      if (item.condition && !item.condition(ctx)) continue;

      const childItems = typeof item.children === "function" ? item.children(type, ctx) : item.children;
      const hasChildren = Array.isArray(childItems) && childItems.some(Boolean);

      const itemElem = document.createElement("div");
      const classes = ["context-menu_menu-item"];
      if (item.border) classes.push("context-menu_menu-item-bordered");
      if (item.dangerous) classes.push("context-menu_menu-item-danger");
      if (hasChildren) classes.push("sa-ctx-menu-dropdown");
      itemElem.className = this.scratchClass(...classes, {
        others: ["react-contextmenu-item", "sa-ctx-menu", item.className || ""],
      });
      itemElem.role = "menuitem";
      itemElem.tabIndex = "-1";

      if (hasChildren) {
        itemElem.setAttribute("aria-haspopup", "menu");
        itemElem.setAttribute("aria-expanded", "false");
        itemElem.style.display = "flex";
        itemElem.style.gap = "8px";
        itemElem.style.paddingRight = "0px";
      }

      const label = document.createElement("span");
      label.textContent = item.label;
      label.style.flex = 1;
      label.style.maxWidth = "250px";
      label.style.overflow = "hidden";
      label.style.whiteSpace = "nowrap";
      label.style.textOverflow = "ellipsis";
      itemElem.append(label);

      let submenuElem = null;
      let expanderElem = null;
      const closeSubmenu = () => {
        if (!submenuElem) return;
        submenuElem.style.display = "none";
        itemElem.setAttribute("aria-expanded", "false");
      };
      const openSubmenu = () => {
        if (!submenuElem) return;
        submenuElem.style.display = "flex";
        itemElem.setAttribute("aria-expanded", "true");
      };

      if (hasChildren) {
        expanderElem = menuExpander.cloneNode(true);
        itemElem.append(expanderElem);

        const syncExpanderColor = () => {
          expanderElem.style.filter = itemElem.hasAttribute("data-highlighted") ? "brightness(0) invert(1)" : "";
        };

        const expanderStateObserver = new MutationObserver(syncExpanderColor);
        expanderStateObserver.observe(itemElem, {
          attributes: true,
          attributeFilter: ["data-highlighted"],
        });
        syncExpanderColor();

        submenuElem = document.createElement("div");
        submenuElem.className = container.className;
        submenuElem.setAttribute("role", "menu");
        submenuElem.style.display = "none";
        submenuElem.style.position = "absolute";
        submenuElem.style.flexDirection = "column";
        submenuElem.style.left = "100%";
        submenuElem.style.width = "max-content";
        submenuElem.style.top = "-10%";
        submenuElem.style.zIndex = "1";
        itemElem.append(submenuElem);

        renderMenuItems(childItems, submenuElem, itemElem, level + 1);

        itemElem.addEventListener("mouseenter", openSubmenu);
        itemElem.addEventListener("mouseleave", closeSubmenu);
        itemElem.addEventListener("click", (e) => {
          e.stopPropagation();
          e.preventDefault();
          openSubmenu();
        });
        itemElem.addEventListener("keydown", (e) => {
          if (e.key === "ArrowRight" || e.key === "Enter" || e.key === " ") {
            e.stopPropagation();
            e.preventDefault();
            openSubmenu();
            const firstChild = submenuElem.firstElementChild;
            submenuElem.childNodes.forEach(child => removeFocus(child));
            if (firstChild) setFocus(firstChild);
          } else if (e.key === "ArrowLeft"
            || (e.key === "ArrowUp" && submenuElem.firstElementChild.hasAttribute('data-highlighted'))
            || (e.key === "ArrowDown" && submenuElem.lastElementChild.hasAttribute('data-highlighted'))
          ) {
            e.stopPropagation();
            e.preventDefault();
            closeSubmenu();
            setFocus(itemElem);
          }
        });
      } else {
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
      }

      itemElem.addEventListener("mouseenter", () => setFocus(itemElem));
      itemElem.addEventListener("mouseleave", () => removeFocus(itemElem));
      itemElem.addEventListener("keydown", itemArrowKeyListener(container, itemElem));

      if (level === 0) {
        this.appendToSharedSpace({
          space: item.position,
          order: item.order,
          scope: ctxMenu,
          element: itemElem,
        });
      } else {
        container.append(itemElem);
      }
    }
  };

  renderMenuItems(hasDynamicContextMenu ? resolveContextMenuItems(contextMenus, type, ctx) : contextMenus, ctxMenu);
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
