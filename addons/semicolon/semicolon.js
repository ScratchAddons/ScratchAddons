export default async function ({ addon, global, console }) {
  if (document.body.contains(document.querySelector("#signature"))) {
    console.log("Signature already exists!");
  } else {
    if (addon.tab.editorMode === "editor") {
      console.log("In editor!");
    } else {
      var semicolon = document.createElement("p");
      semicolon.textContent = ";";
      semicolon.classList.add("semicolon");
      document.body.appendChild(semicolon);
    }
  }
}
