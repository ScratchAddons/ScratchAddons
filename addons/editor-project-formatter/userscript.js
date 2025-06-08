import EditorFormatter from "./formatter.js";

export default async function ({ addon, console, msg, safeMsg: m }) {
  const editorFormatter = new EditorFormatter(addon, console, msg, m);

  document.addEventListener("keydown", function (event) {
    if (event.altKey && event.shiftKey && event.key.toLowerCase() === "c") {
      console.log(JSON.parse(addon.tab.traps.vm.toJSON()));
    }
  });

  editorFormatter.init();
}
