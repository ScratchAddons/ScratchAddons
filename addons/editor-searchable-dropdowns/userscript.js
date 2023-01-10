export default async function ({ addon, console, msg }) {
  const Blockly = await addon.tab.traps.getBlockly();
  const vm = addon.tab.traps.vm;

  const SCRATCH_ITEMS_TO_HIDE = [
    "RENAME_VARIABLE_ID",
    "DELETE_VARIABLE_ID",
    "NEW_BROADCAST_MESSAGE_ID",
    // From rename-broadcasts addon
    "RENAME_BROADCAST_MESSAGE_ID",
  ];

  const canUseAsGlobalVariableName = (name, type) => {
    return !vm.runtime.getAllVarNamesOfType(type).includes(name);
  }

  const canUseAsLocalVariableName = (name, type) => {
    return !vm.editingTarget.lookupVariableByNameAndType(name, type);
  };

  const ADDON_ITEMS = {
    createGlobalVariable: {
      enabled: (name) => canUseAsGlobalVariableName(name, ""),
      createVariable: (workspace, name) => workspace.createVariable(name),
    },
    createLocalVariable: {
      enabled: (name) => canUseAsLocalVariableName(name, ""),
      createVariable: (workspace, name) => workspace.createVariable(name, "", null, true),
    },
    createGlobalList: {
      enabled: (name) => canUseAsGlobalVariableName(name, "list"),
      createVariable: (workspace, name) => workspace.createVariable(name, "list"),
    },
    createLocalList: {
      enabled: (name) => canUseAsLocalVariableName(name, "list"),
      createVariable: (workspace, name) => workspace.createVariable(name, "list", null, true),
    },
    createBroadcast: {
      enabled: (name) => canUseAsGlobalVariableName(name, "broadcast_msg"),
      createVariable: (workspace, name) => workspace.createVariable(name, "broadcast_msg"),
    }
  };

  let blocklyDropDownContent = null;
  let blocklyDropdownMenu = null;
  let searchBar = null;
  // Contains DOM and addon state
  let items = [];
  let searchedItems = [];
  // Tracks internal Scratch state
  let currentDropdownOptions = [];
  let resultOfLastGetOptions = [];

  const oldDropDownDivShow = Blockly.DropDownDiv.show;
  Blockly.DropDownDiv.show = function (...args) {
    blocklyDropdownMenu = document.querySelector(".blocklyDropdownMenu");
    if (!blocklyDropdownMenu) {
      return oldDropDownDivShow.call(this, ...args);
    }

    blocklyDropdownMenu.focus = () => {}; // no-op focus() so it can't steal it from the search bar

    searchBar = document.createElement("input");
    addon.tab.displayNoneWhileDisabled(searchBar, { display: "flex" });
    searchBar.type = "text";
    searchBar.addEventListener("input", updateSearch);
    searchBar.addEventListener("keydown", handleKeyDownEvent);
    searchBar.classList.add("u-dropdown-searchbar");
    blocklyDropdownMenu.insertBefore(searchBar, blocklyDropdownMenu.firstChild);

    items = Array.from(blocklyDropdownMenu.children)
      .filter((child) => child.tagName !== "INPUT")
      .map((element) => ({
        element,
        text: element.textContent,
      }));
    currentDropdownOptions = resultOfLastGetOptions;
    updateSearch();

    // Call the original show method after adding everything so that it can perform the correct size calculations
    const ret = oldDropDownDivShow.call(this, ...args);

    // Lock the size of the dropdown
    blocklyDropDownContent = Blockly.DropDownDiv.getContentDiv();
    blocklyDropDownContent.style.width = getComputedStyle(blocklyDropDownContent).width;
    blocklyDropDownContent.style.height = getComputedStyle(blocklyDropDownContent).height;

    // This is really strange, but if you don't reinsert the search bar into the DOM then focus() doesn't work
    blocklyDropdownMenu.insertBefore(searchBar, blocklyDropdownMenu.firstChild);
    searchBar.focus();

    return ret;
  };

  const oldDropDownDivClearContent = Blockly.DropDownDiv.clearContent;
  Blockly.DropDownDiv.clearContent = function () {
    oldDropDownDivClearContent.call(this);
    items = [];
    searchedItems = [];
    Blockly.DropDownDiv.content_.style.height = "";
  };

  const oldFieldDropdownGetOptions = Blockly.FieldDropdown.prototype.getOptions;
  Blockly.FieldDropdown.prototype.getOptions = function () {
    const options = oldFieldDropdownGetOptions.call(this);
    const block = this.sourceBlock_;
    const isStage = vm.editingTarget && vm.editingTarget.isStage;
    if (block) {
      if (block.category_ === "data") {
        options.push(getMenuItemMessage("createGlobalVariable"));
        if (!isStage) {
          options.push(getMenuItemMessage("createLocalVariable"));
        }
      } else if (block.category_ === "data-lists") {
        options.push(getMenuItemMessage("createGlobalList"));
        if (!isStage) {
          options.push(getMenuItemMessage("createLocalList"));
        }
      } else if (block.type === "event_broadcast_menu" || block.type === "event_whenbroadcastreceived") {
        options.push(getMenuItemMessage("createBroadcast"));
      }
    }
    // Options aren't normally stored anywhere, so we'll store them ourselves.
    resultOfLastGetOptions = options;
    return options;
  };

  const oldFieldVariableOnItemSelected = Blockly.FieldVariable.prototype.onItemSelected;
  Blockly.FieldVariable.prototype.onItemSelected = function (menu, menuItem) {
    const sourceBlock = this.sourceBlock_;
    if (sourceBlock && sourceBlock.workspace && searchBar.value.length !== 0) {
      const workspace = sourceBlock.workspace;
      const optionId = menuItem.getValue();

      if (Object.prototype.hasOwnProperty.call(ADDON_ITEMS, optionId)) {
        const addonItem = ADDON_ITEMS[optionId];
        Blockly.Events.setGroup(true);
        const variable = addonItem.createVariable(workspace, searchBar.value.trim());
        if (this.sourceBlock_) this.setValue(variable.getId());
        Blockly.Events.setGroup(false);
        return;
      }
    }
    return oldFieldVariableOnItemSelected.call(this, menu, menuItem);
  };

  function selectItem(item, click) {
    // You can't just use click() or focus() because Blockly uses mousedown and mouseup handlers, not click handlers.
    item.dispatchEvent(new MouseEvent("mousedown", { relatedTarget: item, bubbles: true }));
    if (click) item.dispatchEvent(new MouseEvent("mouseup", { relatedTarget: item, bubbles: true }));

    // Scroll the item into view if it is offscreen.
    const itemTop = item.offsetTop;
    const itemEnd = itemTop + item.offsetHeight;

    const scrollTop = blocklyDropDownContent.scrollTop;
    const scrollHeight = blocklyDropDownContent.offsetHeight;
    const scrollEnd = scrollTop + scrollHeight;

    if (scrollTop > itemTop) {
      blocklyDropDownContent.scrollTop = itemTop;
    } else if (itemEnd > scrollEnd) {
      blocklyDropDownContent.scrollTop = itemEnd - scrollHeight;
    }
  }

  function performSearch() {
    const rawQuery = searchBar.value.trim();
    const query = rawQuery.trim().toLowerCase();

    const rank = (item, index) => {
      // Negative number will hide
      // Higher numbers will appear first
      const option = currentDropdownOptions[index];
      const optionId = option[1];
      if (SCRATCH_ITEMS_TO_HIDE.includes(optionId)) {
        return query ? -1 : 0;
      } else if (Object.prototype.hasOwnProperty.call(ADDON_ITEMS, optionId)) {
        if (!query) {
          return -1;
        }
        const addonInfo = ADDON_ITEMS[optionId];
        if (addonInfo.enabled(rawQuery)) {
          item.element.lastChild.lastChild.textContent = getMenuItemMessage(optionId)[0];
          return 0;
        }
        return -1;
      }
      const itemText = item.text.toLowerCase();
      if (query === itemText) {
        return 2;
      }
      if (itemText.startsWith(query)) {
        return 1;
      }
      if (itemText.includes(query)) {
        return 0;
      }
      return -1;
    };
    return items
      .map((item, index) => ({
        item,
        score: rank(item, index),
      }))
      .sort(({ score: scoreA }, { score: scoreB }) => Math.max(0, scoreB) - Math.max(0, scoreA));
  }

  function updateSearch() {
    const previousSearchedItems = searchedItems;
    searchedItems = performSearch();
    let needToUpdateDOM = previousSearchedItems.length !== searchedItems.length;
    if (!needToUpdateDOM) {
      for (let i = 0; i < searchedItems.length; i++) {
        if (searchedItems[i].item !== previousSearchedItems[i].item) {
          needToUpdateDOM = true;
          break;
        }
      }
    }
    if (needToUpdateDOM && previousSearchedItems.length > 0) {
      for (const { item } of previousSearchedItems) {
        item.element.remove();
      }
      for (const { item } of searchedItems) {
        blocklyDropdownMenu.appendChild(item.element);
      }
    }
    for (const { item, score } of searchedItems) {
      item.element.hidden = score < 0;
    }
  }

  function handleKeyDownEvent(event) {
    if (event.key === "Enter") {
      // Reimplement enter to select item to account for hidden items and default to the top item.
      event.stopPropagation();
      event.preventDefault();

      const selectedItem = document.querySelector(".goog-menuitem-highlight");
      if (selectedItem && !selectedItem.hidden) {
        selectItem(selectedItem, true);
        return;
      }

      const selectedBlock = Blockly.selected;
      if (searchBar.value === "" && selectedBlock) {
        if (
          selectedBlock.type === "event_broadcast" ||
          selectedBlock.type === "event_broadcastandwait" ||
          selectedBlock.type === "event_whenbroadcastreceived"
        ) {
          // The top item of these dropdowns is always "New message"
          // When pressing enter on an empty search bar, we close the dropdown instead of making a new broadcast.
          Blockly.DropDownDiv.hide();
          return;
        }
      }
      for (const { item } of searchedItems) {
        if (!item.element.hidden) {
          selectItem(item.element, true);
          break;
        }
      }
      // If there is no top value, do nothing and leave the dropdown open
    } else if (event.key === "Escape") {
      Blockly.DropDownDiv.hide();
    } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      // Reimplement keyboard navigation to account for hidden items.
      event.preventDefault();
      event.stopPropagation();

      const items = searchedItems.filter((i) => i.score >= 0).map((i) => i.item);
      if (items.length === 0) {
        return;
      }

      let selectedIndex = -1;
      for (let i = 0; i < items.length; i++) {
        if (items[i].element.classList.contains("goog-menuitem-highlight")) {
          selectedIndex = i;
          break;
        }
      }

      const lastIndex = items.length - 1;
      let newIndex = 0;
      if (event.key === "ArrowDown") {
        if (selectedIndex === -1 || selectedIndex === lastIndex) {
          newIndex = 0;
        } else {
          newIndex = selectedIndex + 1;
        }
      } else {
        if (selectedIndex === -1 || selectedIndex === 0) {
          newIndex = lastIndex;
        } else {
          newIndex = selectedIndex - 1;
        }
      }

      selectItem(items[newIndex].element, false);
    }
  }

  function getMenuItemMessage(message) {
    // Format used internally by Scratch:
    // [human readable name, internal name]
    return [msg(message, { name: searchBar?.value.trim() || "" }), message];
  }
}
