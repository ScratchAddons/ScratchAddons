export default async function ({ addon, global, console }) {
  //define remix tree button elements

  const subactions = document.querySelector(".flex-row.subactions").querySelector(".action-buttons");

  const remixtree = document.createElement("button");
  remixtree.className = "button action-button remixtree-button";
  remixtree.id = "scratchAddonsRemixTreeBtn";
  remixtree.innerHTML = `
    <img src="https://scratch.mit.edu/svgs/project/remix-white.svg" height="15px" style="margin-right: 5px;" />
    <span>Remix Tree</span>
    `;
  remixtree.onclick = () => {
    if (window.location.href.endsWith("/")) window.location.href += "remixtree";
    else window.location.href += "/remixtree";
  };
  remixtree.style.display = "flex";
  remixtree.style.alignItems = "center";
  if (addon.settings.get("buttonColor")) {
    remixtree.style.backgroundColor = hexTest(addon.settings.get("buttonColor"));
  }

  function hexTest(s) {
    let t = "";
    let hex = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f"];
    let len = [1, 3, 6];
    let filter = s.split("").filter((f) => !hex.includes(f));
    if (s.startsWith("#"))
      filter = s
        .split("")
        .slice(1)
        .filter((f) => !hex.includes(f.toLowerCase()));
    console.log(s);
    if (s.startsWith("#")) {
      if (filter == "" && len.includes(s.length - 1)) t = s;
    } else {
      if (filter == "" && len.includes(s.length)) t = "#" + s;
    }

    return t;
  }

  subactions.appendChild(remixtree);
}
