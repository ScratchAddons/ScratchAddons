export default async function ({ addon, global, console }) {
  function callback(mutationList) {
    for (const mutation of mutationList) {
      if (mutation.type === "childList") {
        const newNodes = mutation.addedNodes;
        for (const node of newNodes) {
          if (node.classList && node.classList.contains("blocklyDropdownMenu")) {
            addSearch();
            break;
          }
        }
      }
    }
  }

  function addSearch() {
    const el = document.createElement("input");
    el.type = "text";
    el.addEventListener("input", search);
    el.classList.add("u-dropdown-searchbar");
    const container = getDropDownMenu();
    container.insertBefore(el, container.firstChild);
    el.focus();

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

  let cachedDropDownContentElement = null;
  function getDropDownContentElement() {
    if (cachedDropDownContentElement) {
      return cachedDropDownContentElement;
    }
    cachedDropDownContentElement = document.querySelector(".blocklyDropDownContent");
    return cachedDropDownContentElement;
  }

  function getDropDownMenu() {
    return getDropDownContentElement().querySelector(".blocklyDropdownMenu");
  }

  function getItems() {
    const el = getDropDownMenu();
    if (el) {
      return Array.from(el.children).filter((child) => child.tagName !== "INPUT");
    }
    return [];
  }

  const observer = new MutationObserver(callback);
  // todo: don't put a MutationObserver on the entire body
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}
