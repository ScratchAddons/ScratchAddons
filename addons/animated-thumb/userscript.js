import ThumbSetter from "../../libraries/animated-thumb.js";

export default async function ({ addon, global, console, msg }) {
  while (true) {
    let nav = await addon.tab.waitForElement("[class^='menu-bar_main-menu']", {
      markAsSeen: true,
    });
    if (!document.querySelector("[class^='author-info_username-line']")) {
      let setthumb = document.createElement("div");
      setthumb.classList.add("menu-bar_menu-bar-item_oLDa-");
      setthumb.title = msg("added-by");
      let thumbinner = document.createElement("span");
      thumbinner.setAttribute(
        "class",
        "button_outlined-button_1bS__ menu-bar_menu-bar-button_3IDN0 community-button_community-button_2Lo_g"
      );
      thumbinner.setAttribute("role", "button");
      setthumb.append(thumbinner);
      let thumbcontent = document.createElement("div");
      setthumb.classList.add("button_content_3jdgj");
      thumbinner.append(thumbcontent);
      let thumbspan = document.createElement("span");
      thumbspan.innerText = msg("set-thumbnail");
      thumbcontent.append(thumbspan);
      nav.append(setthumb);
      setthumb.addEventListener("click", function (e) {
        const setter = new ThumbSetter({
          success: msg("success"),
          error: msg("error"),
        });
        setter.addFileInput();
        setter.showInput();
      });
    }
  }
}
