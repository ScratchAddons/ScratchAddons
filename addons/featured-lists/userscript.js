export default async function ({ addon, global, console, msg }) {
  // When user is logging into page it shows:
  // DOMException: Node.insertBefore: Child to insert before is not a child of this node
  var init = async function() {
    const isLoggedIn = await addon.auth.fetchIsLoggedIn();

    addon.tab.waitForElement(".mod-splash").then(() => {
      let list = {
        "FeaturedProjects": document.querySelectorAll("[class='box']")[0],
        "FeaturedStudios": document.querySelectorAll("[class='box']")[1],
        "CuratedProjects": document.querySelectorAll("[class='box']")[2],
        "ScratchStudio": document.querySelectorAll("[class='box']")[3],
        "ProjectsLoved": document.querySelectorAll("[class='box']")[4],
        "CommunityRemixing": document.querySelectorAll("[class='box']")[5],
        "CommunityLoving": document.querySelectorAll("[class='box']")[6]
      }

      if (!isLoggedIn) {
        list["CommunityRemixing"] = document.querySelectorAll("[class='box']")[4];
        list["CommunityLoving"] = document.querySelectorAll("[class='box']")[5];
      }

      document.querySelectorAll(".mod-splash")[1].prepend(document.querySelectorAll(".mod-splash .box")[3]);
      document.querySelectorAll(".mod-splash")[1].prepend(document.querySelectorAll(".mod-splash .box")[2]);

      let modsplash = document.querySelectorAll(".mod-splash")[1];
      modsplash.style.display = "grid";
      let lists = addon.settings.get("lists");
      lists.forEach((item, i) => {
        if (!(!isLoggedIn && item.id == "ProjectsLoved")) {
          list[item.id].style.order = i;
        }
      });
    });
  }

  init();
}
