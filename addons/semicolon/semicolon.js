export default async function ({ addon, global, console }) {
  if (addon.tab.editorMode === "editor") {
    console.log("In editor!");
  } else {
    var semicolon = document.createElement("p");
    semicolon.textContent = ";";
    semicolon.classList.add("semicolon");
    document.body.appendChild(semicolon);
  }
  addon.tab.addEventListener("urlChange", () => {
    if (addon.tab.editorMode === "editor" || window.location.href.includes('fullscreen')) {
      document.getElementsByClassName("semicolon")[0].style.display = "none";
    } else {
      document.getElementsByClassName("semicolon")[0].style.display = "block";
    }
  })
}
