export default async function ({ addon, console }) {
  /*
To do:
Add support for the command key?

*/
  function local() {
    return document.querySelector("input[type=radio][value=local]");
  }
  function global() {
    return document.querySelector("input[type=radio][value=global]");
  }
  function ok() {
    return document.querySelector("button[class*=prompt_ok-button]");
  }
  let toClick;

  document.addEventListener("keydown", (e) => {
    if (!(e.ctrlKey || e.metaKey)) return;
    if (!toClick) {
      toClick = local()?.checked ? local() : global();
      local()?.click();
    }
    if (e.key === "Enter") {
      ok().click();
    }
  });

  document.addEventListener("keyup", (e) => {
    if (!(e.key === "Control")) return;
    toClick?.click();
    toClick = null;
  });
}
