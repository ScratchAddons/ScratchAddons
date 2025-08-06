export default async function ({ addon, console }) {
  if (!window.mySettings) return;
  const ua = window.mySettings.markupSet.find((x) => x.className);
  ua.openWith = window._simple_http_agent = ua.openWith.replace("version", "versions");
  if (location.pathname === "/discuss/3/topic/add/") {
    const textarea = document.getElementById("id_body");
    textarea.value = ua.openWith;
  }
}
