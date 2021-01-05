export default async function ({ addon, global, console }) {
  var semicolon = document.createElement("p");
  semicolon.textContent = ";";
  semicolon.classList.add("semicolon");
  document.body.appendChild(semicolon);

  addon.tab.addEventListener("urlChange", () => {
    var semicolon = document.createElement("p");
    semicolon.textContent = ";";
    semicolon.classList.add("semicolon");
    document.body.appendChild(semicolon);

    if (addon.tab.editorMode === "editor" || addon.tab.editorMode === "fullscreen") {
      document.getElementsByClassName("semicolon")[0].style.display = "none";
    } else {
      document.getElementsByClassName("semicolon")[0].style.display = "block";
    }
  });
}
