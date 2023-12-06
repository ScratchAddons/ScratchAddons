export default async function ({ addon, console }) {
  /*
To do:
Add support for the command key
Find way to make ctrl + enter work like enter, variables cant be made while ctrl is pressed (at least on tw desktop)

*/
  await addon.tab.waitForElement("input[type=radio][value=local]");
  const local = document.querySelector("input[type=radio][value=local]");
  const global = document.querySelector("input[type=radio][value=global]");
  let toClick;

  document.addEventListener("keydown", (e) => {
    if (!(e.ctrlKey || e.metaKey)) return;
    if (!toClick) {
      toClick = local.checked ? local : global;
      local?.click();
    }
  });

  document.addEventListener("keyup", (e) => {
    if (!(e.key === "Control")) return;
    toClick?.click();
    toClick = null;
  });
}
