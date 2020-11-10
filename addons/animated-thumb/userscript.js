export default async function ({ addon, global, console }) {
  while (true) {
    let nav = await addon.tab.waitForElement("[class^='menu-bar_main-menu']", {
      markAsSeen: true,
    });
    if (!document.querySelectorAll("[class^='author-info_username-line']").length > 0) {
      let setthumb = document.createElement("div");
      setthumb.classList.add("menu-bar_menu-bar-item_oLDa-");
      setthumb.title = "Button added by Scratch Addons browser extension";
      let thumbinner = document.createElement("span");
      thumbinner.style.borderWidth = "1px";
      thumbinner.style.borderStyle = "solid";
      thumbinner.style.borderColor = "rgb(255, 123, 38)";
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
      thumbspan.innerText = "Set Thumbnail";
      thumbcontent.append(thumbspan);
      nav.append(setthumb);
      setthumb.addEventListener("click", function (e) {
        addon.tab.loadScript("https://worldlanguages.github.io/animatedThumbnailsBookmarklet/code.js");
      });
    }
  }
}
