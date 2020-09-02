export default async function ({ addon, global, console }) {
  // The hierarchy is:
  // blocklyDropDownDiv (position, background color, etc.) -> blocklyDropDownContent (scrollbar) -> blocklyDropdownMenu (items)
  // The capitalization of dropdown is inconsistent in blockly too.
  let blocklyDropDownDiv = null;
  let blocklyDropDownContent = null;
  let blocklyDropdownMenu = null;

  let searchBar;

  function createSearchBar(node) {
    blocklyDropdownMenu = node;

    // Create the search bar if it doesn't exist.
    if (!searchBar) {
      searchBar = document.createElement("input");
      searchBar.type = "text";
      searchBar.addEventListener("input", handleSearchInput);
      searchBar.classList.add("u-dropdown-searchbar");
      blocklyDropDownDiv.insertBefore(searchBar, blocklyDropDownDiv.firstChild);
    }

    searchBar.focus();

    // Lock the width and height of the dropdown so that it doesn't resize as the user searches.
    const computedStyle = getComputedStyle(blocklyDropDownContent);
    blocklyDropDownContent.style.width = computedStyle.width;
    blocklyDropDownContent.style.height = computedStyle.height;
  }

  function cleanup() {
    blocklyDropdownMenu = null;
  }

  function handleSearchInput(event) {
    const value = event.target.value.toLowerCase();
    for (const item of getItems()) {
      const text = item.textContent.toLowerCase();
      const contains = text.includes(value);
      item.hidden = !contains;
    }
  }

  function getItems() {
    if (blocklyDropdownMenu) {
      return Array.from(blocklyDropdownMenu.children).filter((child) => child.tagName !== "INPUT");
    }
    return [];
  }

  function findBlocklyDropDownDiv() {
    return new Promise((resolve, reject) => {
      // See if the div already exists. This can happen when loading directly into the editor.
      const div = document.querySelector(".blocklyDropDownDiv");
      if (div) {
        resolve(div);
        return;
      }

      // Otherwise, use a MutationObserver to find out when it's created.
      const observer = new MutationObserver((mutationList) => {
        for (const mutation of mutationList) {
          if (mutation.type === "childList") {
            for (const node of mutation.addedNodes) {
              if (node.classList && node.classList.contains("blocklyDropDownDiv")) {
                resolve(node);
                observer.disconnect();
                return;
              }
            }
          }
        }
      });
      observer.observe(document.body, {
        childList: true,
      });
    });
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
