export default async function ({ addon }) {
  setInterval(() => {
    [...document.querySelectorAll(".blocklyHtmlInput:not(.sa-editor-number-arrow-keys)")].forEach((elt) => {
      elt.addEventListener("keydown", (e) => {
        if (!["ArrowUp", "ArrowDown"].includes(e.code) || Number(elt.value).toString() !== elt.value) {
          return;
        }
        e.preventDefault();
        elt.value =
          Number(elt.value) +
          (e.altKey ? 0.1 : e.shiftKey ? 10 : e.ctrlKey ? 100 : 1) * (e.code === "ArrowUp" ? 1 : -1);
      });
      elt.classList.add("sa-editor-number-arrow-keys");
    });
  });
}
