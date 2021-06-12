export default async function ({ addon, global, console }) {
  /* The hierarchy is:
  blocklyDropDownDiv (position, background color, etc.) ->
  blocklyDropDownContent (scrollbar) ->
  blocklyDropdownMenu (items)
  */
  // The capitalization of dropdown is inconsistent in blockly too.

  const Blockly = await addon.tab.traps.getBlockly();

  let blocklyDropdownMenu = null;
  let blocklyDropDownContent = null;

  let searchBar = null;
  let fieldVariable = null;

  const oldDropDownDivShow = Blockly.DropDownDiv.show;
  Blockly.DropDownDiv.show = function (owner, ...args) {
    fieldVariable = owner;
    const arrowAtTop = oldDropDownDivShow.call(this, owner, ...args);

    let blocklyDropDownDiv = Blockly.DropDownDiv.DIV_;
    blocklyDropDownContent = Blockly.DropDownDiv.getContentDiv();
    blocklyDropdownMenu = document.querySelector(".blocklyDropdownMenu");
    blocklyDropdownMenu.focus = () => {}; // no-op focus() so it can't steal it from the search bar

    // Lock the width of the dropdown before adding the search bar, as sometimes adding the searchbar changes the width.
    blocklyDropDownContent.style.width = getComputedStyle(blocklyDropDownContent).width;

    const container = document.createElement("div");
    addon.tab.displayNoneWhileDisabled(container, { display: "flex" });
    container.classList.add("u-dropdown-container");

    searchBar = document.createElement("input");

    searchBar.type = "text";
    searchBar.addEventListener("input", handleInputEvent);
    searchBar.addEventListener("keydown", handleKeyDownEvent);
    searchBar.classList.add("u-dropdown-searchbar");

    const button = document.createElement("button");
    button.addEventListener("click", () => {
      if (searchBar.value.length === 0) return;
      const variable = Blockly.getMainWorkspace().createVariable(searchBar.value, "broadcast_msg");
      fieldVariable.setValue(variable.getId());
      Blockly.DropDownDiv.hide();
    });
    button.classList.add("u-dropdown-button");
    button.innerText = "Add";

    container.append(searchBar);

    const selectedBlock = Blockly.selected;
    if (
      selectedBlock &&
      (selectedBlock.type === "event_broadcast" ||
        selectedBlock.type === "event_broadcastandwait" ||
        selectedBlock.type === "event_whenbroadcastreceived")
    )
      container.append(button);

    blocklyDropdownMenu.insertBefore(container, blocklyDropdownMenu.firstChild);

    // Lock the height of the dropdown after adding the search bar.
    blocklyDropDownContent.style.height = getComputedStyle(blocklyDropDownContent).height;

    searchBar.focus();

    return arrowAtTop;
  };

  const oldDropDownDivClearContent = Blockly.DropDownDiv.clearContent;
  Blockly.DropDownDiv.clearContent = function () {
    oldDropDownDivClearContent.call(this);
    Blockly.DropDownDiv.content_.style.height = "";
    blocklyDropdownMenu = null;
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
    const value = event.target.value.toLowerCase();
    for (const item of getItems()) {
      const text = item.content_.toLowerCase();
      const hidden = !text.includes(value);
      item.element_.hidden = hidden;
    }
  }

  function handleKeyDownEvent(event) {
    if (event.key === "Enter") {
      // Reimplement enter to select item to account for hidden items and default to the top item.
      event.stopPropagation();
      event.preventDefault();

      const selectedItem = blocklyDropdownMenu.querySelector(".goog-menuitem-highlight");
      if (selectedItem && !selectedItem.hidden) {
        selectItem(selectedItem, true);
        return;
      }

      const selectedBlock = Blockly.selected;
      const items = getItems();
      if (event.target.value === "" && selectedBlock) {
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
          selectItem(item, true);
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

      selectItem(items[newIndex], false);
    }
  }

  function getItems() {
    return fieldVariable?.selectedItem.parent_.children_ || [];
  }
}
