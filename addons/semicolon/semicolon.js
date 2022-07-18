export default async function ({ addon, global, console }) {
  const semicolon = document.createElement("p");
  semicolon.textContent = ";";
  semicolon.classList.add("semicolon");
  semicolon.style.display = "none"; // overridden by userstyle if the addon is enabled
  document.body.appendChild(semicolon);
  const ready = () => {
    if (addon.tab.editorMode === "editor" || addon.tab.editorMode === "fullscreen") {
      semicolon.classList.remove("visible");
    } else {
      semicolon.classList.add("visible");
    }
  };
  ready();
  addon.tab.addEventListener("urlChange", ready);
}
