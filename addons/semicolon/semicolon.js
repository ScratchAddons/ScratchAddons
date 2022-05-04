export default async function ({ addon, global, console }) {
  const semicolon = document.createElement("p");
  semicolon.textContent = ";";
  semicolon.classList.add("semicolon");
  document.body.appendChild(semicolon);
  const ready = () => {
    if (addon.tab.editorMode === "editor" || addon.tab.editorMode === "fullscreen") {
      semicolon.style.display = "none";
    } else {
      semicolon.style.display = "block";
    }
  };
  ready();
  addon.tab.addEventListener("urlChange", ready);
  addon.tab.displayNoneWhileDisabled(semicolon);
}
