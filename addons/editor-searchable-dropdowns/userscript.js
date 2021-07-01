export default async function ({ addon, global, console, msg }) {
  const Blockly = await addon.tab.traps.getBlockly();

  const ADDON_ITEMS = [
    "createGlobalVariable",
    "createLocalVariable",
    "createGlobalList",
    "createLocalList",
    "createBroadcast",
  ];

  let blocklyDropDownContent = null;

  let searchBar = null;
  let fieldVariable = null;
  let fieldDropdown = null;

  const oldDropDownDivShow = Blockly.DropDownDiv.show;
  Blockly.DropDownDiv.show = function (...args) {
    fieldVariable = args[0];

    const blocklyDropdownMenu = document.querySelector(".blocklyDropdownMenu");
    if (!blocklyDropdownMenu) {
      return oldDropDownDivShow.call(this, ...args);
    }

    blocklyDropdownMenu.focus = () => {}; // no-op focus() so it can't steal it from the search bar

    searchBar = document.createElement("input");
    addon.tab.displayNoneWhileDisabled(searchBar, { display: "flex" });
    searchBar.type = "text";
    searchBar.addEventListener("input", handleInputEvent);
    searchBar.addEventListener("keydown", handleKeyDownEvent);
    searchBar.classList.add("u-dropdown-searchbar");
    blocklyDropdownMenu.insertBefore(searchBar, blocklyDropdownMenu.firstChild);

    for (const item of getItems()) {
      item.element_.hidden = hideItem(item);
    }

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
    Blockly.DropDownDiv.content_.style.height = "";
  };

  const oldFieldDropdownGetOptions = Blockly.FieldDropdown.prototype.getOptions;
  Blockly.FieldDropdown.prototype.getOptions = function () {
    fieldDropdown = this;
    const options = oldFieldDropdownGetOptions.call(this);
    const block = this.sourceBlock_;
    if (block) {
      if (block.category_ === "data") {
        options.push(getMsg("createGlobalVariable"), getMsg("createLocalVariable"));
      } else if (block.category_ === "data-lists") {
        options.push(getMsg("createGlobalList"), getMsg("createLocalList"));
      } else if (["event_broadcast_menu", "event_whenbroadcastreceived"].includes(block.type)) {
        options.push(getMsg("createBroadcast"));
      }
    }
    return options;
  };

  const oldFieldVariableOnItemSelected = Blockly.FieldVariable.prototype.onItemSelected;
  Blockly.FieldVariable.prototype.onItemSelected = function (menu, menuItem) {
    const sourceBlock = this.sourceBlock_;
    if (sourceBlock && sourceBlock.workspace && searchBar.value.length !== 0) {
      const workspace = sourceBlock.workspace;
      const id = menuItem.getValue();
      switch (id) {
        case "createGlobalVariable": {
          const variable = workspace.createVariable(searchBar.value);
          // Creating a variable can cause blocks in the flyout to be disposed and recreated
          // That could cause setValue to throw
          if (this.sourceBlock_) this.setValue(variable.getId());
          return;
        }
        case "createLocalVariable": {
          const variable = workspace.createVariable(searchBar.value, "", null, true);
          if (this.sourceBlock_) this.setValue(variable.getId());
          return;
        }
        case "createGlobalList": {
          const variable = workspace.createVariable(searchBar.value, "list");
          if (this.sourceBlock_) this.setValue(variable.getId());
          return;
        }
        case "createLocalList": {
          const variable = workspace.createVariable(searchBar.value, "list", null, true);
          if (this.sourceBlock_) this.setValue(variable.getId());
          return;
        }
        case "createBroadcast": {
          const variable = workspace.createVariable(searchBar.value, "broadcast_msg");
          this.setValue(variable.getId());
          return;
        }
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

  function handleInputEvent(event) {
    fieldDropdown.selectedItem.parent_.children_.forEach((item) => {
      if (ADDON_ITEMS.includes(item.model_)) {
        item.element_.lastChild.lastChild.textContent = item.content_ = getMsg(item.model_)[0];
      }
    });

    const value = searchBar.value.toLowerCase();
    for (const item of getItems()) {
      const text = item.content_;
      item.element_.hidden =
        // Hide scratch's items when we've typed something in
        ["RENAME_VARIABLE_ID", "DELETE_VARIABLE_ID", "NEW_BROADCAST_MESSAGE_ID"].includes(item.model_) &&
        value.length !== 0
          ? true
          : !text.toLowerCase().includes(value) || hideItem(item);
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
      const items = getItems();
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
      for (const item of items) {
        if (!item.element_.hidden) {
          selectItem(item.element_, true);
          break;
        }
      }
      // If there is no top value, just leave the dropdown open.
    } else if (event.key === "Escape") {
      Blockly.DropDownDiv.hide();
    } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      // Reimplement keyboard navigation to account for hidden items.
      event.preventDefault();
      event.stopPropagation();

      const items = getItems().filter((item) => !item.element_.hidden);
      if (items.length === 0) {
        return;
      }

      let selectedIndex = -1;
      for (let i = 0; i < items.length; i++) {
        if (items[i].element_.classList.contains("goog-menuitem-highlight")) {
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

      selectItem(items[newIndex].element_, false);
    }
  }

  function getItems() {
    return fieldVariable?.selectedItem.parent_.children_ || [];
  }

  function getMsg(message) {
    return [msg(message, { name: searchBar?.value || "" }), message];
  }

  function hideItem(item) {
    return ADDON_ITEMS.includes(item.model_) && searchBar.value.length === 0;
  }
}
