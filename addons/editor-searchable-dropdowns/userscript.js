export default async function ({ addon, global, console }) {
  function addSearch(blocklyDropdownMenu) {
    const el = document.createElement("input");
    el.type = "text";
    el.addEventListener("input", search);
    el.classList.add("u-dropdown-searchbar");
    const container = getDropDownMenu();
    container.insertBefore(el, container.firstChild);
    el.focus();

    const blocklyDropDownContent = blocklyDropdownMenu.parentNode;
    const computedStyle = getComputedStyle(blocklyDropDownContent);
    blocklyDropDownContent.style.width = computedStyle.width;
    blocklyDropDownContent.style.height = computedStyle.height;

    for (const child of getItems()) {
      child.hidden = false;
    }
  }

  function search(e) {
    const value = e.target.value.toLowerCase();
    for (const child of getItems()) {
      const text = child.textContent.toLowerCase();
      const contains = text.includes(value);
      child.hidden = !contains;
    }
  }

  function getDropDownMenu() {
    return document.querySelector(".blocklyDropdownMenu");
  }

  function getItems() {
    const el = getDropDownMenu();
    if (el) {
      return Array.from(el.children).filter((child) => child.tagName !== "INPUT");
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

  findBlocklyDropDownDiv().then((blocklyDropDownDiv) => {
    const blocklyDropDownContent = blocklyDropDownDiv.querySelector(".blocklyDropDownContent");

    // Use a MutationObserver to find out when a dropdown is created.
    const observer = new MutationObserver((mutationList) => {
      for (const mutation of mutationList) {
        if (mutation.type === "childList") {
          for (const node of mutation.addedNodes) {
            if (node.classList && node.classList.contains("blocklyDropdownMenu")) {
              addSearch(node);
              return;
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
