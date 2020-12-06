export default async ({ addon }) => {
  // When user clicks "See Project Page"
  addon.tab.addEventListener("urlChange", e => {
    if (!e.detail) return;
    const regex = /(?:editor|fullscreen)\/?/gi;
    const oldMatched = regex.test(e.detail.oldUrl || "");
    const newMatched = regex.test(e.detail.newUrl || "");
    const darkWWWStyles = document.querySelectorAll("style[data-addon-id=\"dark-www\"]");
    if (darkWWWStyles) {
      if (!oldMatched && newMatched) {
        // Media query is always false, effectively disabling the addon
        darkWWWStyles.forEach(elem => elem.media = "(color) and (not color)");
      } else if (!newMatched && oldMatched) {
        darkWWWStyles.forEach(elem => elem.media = "");
      }
    }
  });
  
  // Initial page load
  const editorMode = addon.tab.editorMode;
  if (editorMode && editorMode !== "projectpage") {
    const darkWWWStyles = document.querySelectorAll("style[data-addon-id=\"dark-www\"]");
    if (darkWWWStyles) {
      darkWWWStyles.forEach(elem => elem.media = "(color) and (not color)");
    }
  }
}