import ThumbSetter from "../../libraries/animated-thumb.js";

export default async function ({ addon, global, console, msg }) {
  while (true) {
    let nav = await addon.tab.waitForElement("[class^='menu-bar_main-menu']", {
      markAsSeen: true,
    });
    if (!document.querySelector("[class^='author-info_username-line']")) {
      let setthumb = document.createElement("div");
      setthumb.classList.add(addon.tab.scratchClass("menu-bar_menu-bar-item"));
      setthumb.title = msg("added-by");
      let thumbinner = document.createElement("span");
      thumbinner.setAttribute(
        "class",
        addon.tab.scratchClass(
          "button_outlined-button",
          "menu-bar_menu-bar-button",
          "community-button_community-button"
        )
      );
      thumbinner.setAttribute("role", "button");
      setthumb.append(thumbinner);
      let thumbcontent = document.createElement("div");
      setthumb.classList.add(addon.tab.scratchClass("button_content"));
      thumbinner.append(thumbcontent);
      let thumbspan = document.createElement("span");
      thumbspan.innerText = msg("set-thumbnail");
      thumbcontent.append(thumbspan);
      nav.append(setthumb);
      setthumb.addEventListener("click", function (e) {
        const setter = new ThumbSetter((key) => msg(`/${key}`));
        setter.addFileInput();
        setter.showInput();
      });
    }
  }
}
