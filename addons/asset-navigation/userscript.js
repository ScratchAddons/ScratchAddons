export default async function ({ addon, console, msg }) {
  let items = [];

  function getSelectedIndex() {
    for (let i = 0; i < items.length; i++) {
      if (items[i].className.includes("is-selected")) {
        return i;
      }
    }
    return 0;
  }

  document.addEventListener(
    "keydown",
    (event) => {
      if (addon.self.disabled) return;
      if (!["PageUp", "PageDown", "Home", "End"].includes(event.key)) return;
      if (["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) return;

      event.preventDefault();
      event.stopPropagation();
      if (document.activeElement) {
        document.activeElement.blur();
      }

      const assetPanel = document.querySelector("[class*='selector_list-area']");
      if (!assetPanel) return;
      items = assetPanel.querySelectorAll("[class*='selector_list-item']");
      if (items.length === 0) return;

      const currentIndex = getSelectedIndex();
      let newIndex = currentIndex;
      let lastIndex = items.length - 1;

      switch (event.key) {
        case "PageUp":
          newIndex = Math.max(0, currentIndex - 1);
          break;
        case "PageDown":
          newIndex = Math.min(lastIndex, currentIndex + 1);
          break;
        case "Home":
          newIndex = 0;
          break;
        case "End":
          newIndex = lastIndex;
      }

      // Select the new asset
      if (newIndex !== currentIndex) {
        items[newIndex].click();
        // Scroll the asset panel to keep the selection in view
        items[newIndex].scrollIntoView({
          behavior: "auto",
          block: "nearest",
        });
      }
    },
    true
  );
}
