export default async function ({ addon }) {
  const settings = {
    none: 0,
    one: 1,
    ten: 10,
    hundred: 100,
    thousand: 1000,
  };
  document.body.addEventListener("keydown", (e) => {
    e.target.classList;
    if (!e.target.classList.contains("blocklyHtmlInput")) {
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
        ? settings[addon.settings.get("shift")]
        : e.ctrlKey
        ? settings[addon.settings.get("ctrl")]
        : e.altKey
        ? settings[addon.settings.get("alt")]
        : settings[addon.settings.get("regular")]) *
        (e.code === "ArrowUp" ? 1 : -1);
  });
}
