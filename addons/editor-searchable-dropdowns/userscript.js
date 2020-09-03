export default async function ({ addon, global, console }) {
  // The hierarchy is:
  // blocklyDropDownDiv (position, background color, etc.) -> blocklyDropDownContent (scrollbar) -> blocklyDropdownMenu (items)
  // The capitalization of dropdown is inconsistent in blockly too.
  let blocklyDropDownDiv = null;
  let blocklyDropDownContent = null;
  let blocklyDropdownMenu = null;

  function createSearchBar(node) {
    blocklyDropdownMenu = node;

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
      // If an item is already selected, let the editor handle it.
      if (document.querySelector(".goog-menuitem-highlight")) {
        return;
      }
      const items = getItems();
      for (const item of items) {
        if (!item.hidden) {
          // You can't just do item.click() -- Blockly uses mousedown and mouseup handlers for this, not click.
          item.dispatchEvent(new MouseEvent("mousedown", { relatedTarget: item, bubbles: true }));
          item.dispatchEvent(new MouseEvent("mouseup", { relatedTarget: item, bubbles: true }));
          break;
        }
      }
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
