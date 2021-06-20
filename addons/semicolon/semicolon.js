export default async (/** @type {import("../../types").Userscript} */ { addon, console }) => {
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
};
