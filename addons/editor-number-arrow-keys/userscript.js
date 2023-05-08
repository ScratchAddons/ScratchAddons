export default async function ({ addon }) {
  setInterval(() => {
    [...document.querySelectorAll(".blocklyHtmlInput:not(.sa-editor-number-arrow-keys)")].forEach((elt) => {
      elt.addEventListener("keydown", (e) => {
        if (
          !["ArrowUp", "ArrowDown"].includes(e.code) ||
          Number(elt.value).toString().replace(/^0*/, "") !== elt.value.replace(/^0*/, "")
        ) {
          return;
        }
        e.preventDefault();
        // if (e.altKey) {
        //   // Because of JavaScript math like 0.1+0.2=0.30000000000000004
        //   elt.value = (Number(elt.value) * 10 + (e.code === "ArrowUp" ? 1 : -1)) / 10;
        // } else {
        elt.value =
          Number(elt.value) +
          (e.shiftKey
            ? addon.settings.get("shift")
            : e.ctrlKey
            ? addon.settings.get("ctrl")
            : e.altKey
            ? addon.settings.get("alt")
            : addon.settings.get("regular")) *
            (e.code === "ArrowUp" ? 1 : -1);
        // }
      });
      elt.classList.add("sa-editor-number-arrow-keys");
    });
  });
}
