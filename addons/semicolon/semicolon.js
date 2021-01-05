export default async function ({ addon, global, console }) {
const ready = () => {
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
ready()
  addon.tab.addEventListener("urlChange", ready)
