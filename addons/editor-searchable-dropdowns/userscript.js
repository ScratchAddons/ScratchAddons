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
    searchBar.classList.add("u-dropdown-searchbar");
    blocklyDropDownContent.insertBefore(searchBar, blocklyDropDownContent.firstChild);

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
