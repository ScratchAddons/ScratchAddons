export default async function ({ addon }) {
  document.body.addEventListener("keydown", (e) => {
    if (!e.target.classList.add("blocklyHtmlInput")) {
      return;
    }
    if (
      !["ArrowUp", "ArrowDown"].includes(e.code) ||
      Number(e.target.value).toString().replace(/^0*/, "") !== e.target.value.replace(/^0*/, "")
    ) {
      return;
    }
    e.preventDefault();
    e.target.value =
      Number(e.target.value) +
      (e.shiftKey
        ? addon.settings.get("shift")
        : e.ctrlKey
        ? addon.settings.get("ctrl")
        : e.altKey
        ? addon.settings.get("alt")
        : addon.settings.get("regular")) *
        (e.code === "ArrowUp" ? 1 : -1);
  });
}
