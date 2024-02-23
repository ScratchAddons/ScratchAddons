export default async function ({ addon, console }) {
  addon.settings.addEventListener("change", function () {
    const font = addon.settings.get("font");
    document.getElementsByTagName("body")[0].style.fontFamily = font;
  });
}
