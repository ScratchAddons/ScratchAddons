export default async function ({ addon, console }) {
  const { open, close, container, content, backdrop, closeButton } = addon.tab.createModal("Test Modal", {
    useEditorClasses: true,
  });
  backdrop.addEventListener("click", close);
  closeButton.addEventListener("click", close);
  content.style.padding = "1rem";
  content.innerText = "Content goes here!";
  window.openTestModal = open;
  window.closeTestModal = close;
  if (addon.tab.editorMode !== null) {
    container.style.width = "500px";
    content.style.backgroundColor = "white";
    content.style.color = "#575e75";
  }
}
