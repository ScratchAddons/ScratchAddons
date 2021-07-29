export default async function ({ addon, global, console, msg }) {
  while (1) {
    await addon.tab.waitForElement(".stats", {
      reduxCondition: (state) => state.scratchGui.mode.isPlayerOnly,
      markAsSeen: true,
    });

    addon.settings.get("loves") && (document.querySelector(".project-loves").innerText = "");
    addon.settings.get("favorites") && (document.querySelector(".project-favorites").innerText = "");
    addon.settings.get("remixes") && document.querySelector(".project-remixes").remove();
    addon.settings.get("views") && document.querySelector(".project-views").remove();

    // Loves & favorites mutate innerText; we use redux

    let listener = (e) => {
      if (!state.scratchGui.mode.isPlayerOnly) return addon.tab.redux.removeEventListener("statechanged", listener);
      let projectLoves = document.querySelector(".project-loves");
      let projectFavorites = document.querySelector(".project-favorites");
      projectLoves && (projectLoves.innerText = "");
      projectFavorites && (projectFavorites.innerText = "");
    };

    addon.tab.redux.addEventListener("statechanged", listener);
  }
}
