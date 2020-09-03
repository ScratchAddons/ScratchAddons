export default async function ({ addon, global, console }) {
  // The hierarchy is:
  // blocklyDropDownDiv (position, background color, etc.) -> blocklyDropDownContent (scrollbar) -> blocklyDropdownMenu (items)
  // The capitalization of dropdown is inconsistent in blockly too.
  let blocklyDropDownDiv = null;
  let blocklyDropDownContent = null;
  let blocklyDropdownMenu = null;

  function createSearchBar(node) {
    blocklyDropdownMenu = node;
    blocklyDropdownMenu.focus = () => {}; // no-op focus() so it can't steal it from the search bar

    // Lock the width of the dropdown before adding the search bar.
    blocklyDropDownContent.style.width = getComputedStyle(blocklyDropDownContent).width;

    const searchBar = document.createElement("input");
    searchBar.type = "text";
    searchBar.addEventListener("input", handleInputEvent);
    searchBar.addEventListener("keydown", handleKeyDownEvent);
    searchBar.classList.add("u-dropdown-searchbar");
    blocklyDropdownMenu.insertBefore(searchBar, blocklyDropdownMenu.firstChild);

    // Lock the height of the dropdown after adding the search bar.
    blocklyDropDownContent.style.height = getComputedStyle(blocklyDropDownContent).height;

    searchBar.focus();
  }

  function cleanup() {
    blocklyDropdownMenu = null;
    // Reset all the things we changed about the dropdown menu.
    // This matters because there's other types of dropdowns such as angle selectors where a search bar doesn't make sense.
    blocklyDropDownContent.style.width = "";
    blocklyDropDownContent.style.height = "";
  }

  function closeDropDown() {
    document.querySelector(".blocklyToolboxDiv").dispatchEvent(new MouseEvent("mousedown"));
  }

  function selectItem(item, click) {
    // You can't just use click() or focus() because Blockly uses mousedown and mouseup handlers, not click handlers.
    item.dispatchEvent(new MouseEvent("mousedown", { relatedTarget: item, bubbles: true }));
    if (click) {
      item.dispatchEvent(new MouseEvent("mouseup", { relatedTarget: item, bubbles: true }));
    }

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
      const text = item.textContent.toLowerCase();
      const contains = text.includes(value);
      item.hidden = !contains;
    }
  }

  function handleKeyDownEvent(event) {
    if (event.key === "Enter") {
      // If an item is already selected and is not hidden, let the editor handle it.
      const selectedItem = document.querySelector(".goog-menuitem-highlight");
      if (selectedItem && !selectedItem.hidden) {
        return;
      }
      // Need to stop propagation in case there are no items to make sure that the editor doesn't try to select a hidden item.
      event.stopPropagation();
      for (const item of getItems()) {
        if (!item.hidden) {
          selectItem(item, true);
          break;
        }
      }
      // If no item was selected, that's fine. Not doing anything is the best solution.
    } else if (event.key === "Escape") {
      closeDropDown();
    } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      // We need to reimplement keyboard navigation to account for hidden items.

      event.preventDefault(); // prevent scrolling
      event.stopPropagation(); // don't let the editor handle it

      const items = getItems().filter((item) => !item.hidden);
      if (items.length === 0) {
        // No items.
        return;
      }

      let selectedIndex = -1;
      for (let i = 0; i < items.length; i++) {
        if (items[i].classList.contains("goog-menuitem-highlight")) {
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
    if (blocklyDropdownMenu) {
      return Array.from(blocklyDropdownMenu.children).filter((child) => child.tagName !== "INPUT");
    }
    return [];
  }

  function findBlocklyDropDownDiv() {
    return addon.tab.waitForElement(".blocklyDropDownDiv").then(() => document.querySelector(".blocklyDropDownDiv"));
  }

  findBlocklyDropDownDiv().then((div) => {
    blocklyDropDownDiv = div;
    blocklyDropDownContent = blocklyDropDownDiv.querySelector(".blocklyDropDownContent");

    const observer = new MutationObserver((mutationList) => {
      for (const mutation of mutationList) {
        if (mutation.type === "childList") {
          // Look for a dropdown being created.
          for (const node of mutation.addedNodes) {
            if (node.classList && node.classList.contains("blocklyDropdownMenu")) {
              createSearchBar(node);
              break;
            }
          }
          // Look for a dropdown being removed.
          for (const node of mutation.removedNodes) {
            if (node.classList && node.classList.contains("blocklyDropdownMenu")) {
              cleanup();
              break;
            }
          }
        }
      }
    });
    observer.observe(blocklyDropDownContent, {
      childList: true,
    });
  });
}
