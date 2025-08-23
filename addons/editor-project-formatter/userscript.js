import EditorFormatter from "./formatter.js";

export default async function ({ addon, console, msg, safeMsg: m }) {
  const editorFormatter = new EditorFormatter(addon, console, msg, m);

  editorFormatter.init();
}
