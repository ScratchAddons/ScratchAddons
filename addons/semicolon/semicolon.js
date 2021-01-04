export default async function ({ addon, global, console }) {
  if (addon.tab.editorMode === "editor") {
    console.log("In editor!");
  } else {
    var semicolon = document.createElement("p");
    semicolon.textContent = ";";
    semicolon.classList.add("semicolon");
    document.body.appendChild(semicolon);
  }
}
