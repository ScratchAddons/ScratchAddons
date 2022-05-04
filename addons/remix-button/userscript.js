export default async function ({ addon, msg, global, console }) {
  const isLoggedIn = await addon.auth.fetchIsLoggedIn();
  if (!isLoggedIn) return;
  const username = await addon.auth.fetchUsername();
  const { redux } = addon.tab;

  await redux.waitForState(
    (state) => state.preview.status.project === "FETCHED" && state.preview.projectInfo.author?.username === username
  );
  while (true) {
    await addon.tab.waitForElement(".project-buttons .see-inside-button", {
      markAsSeen: true,
      reduxCondition: (state) => (state.scratchGui ? state.scratchGui.mode.isPlayerOnly : true),
    });

    const button = document.createElement("button");
    button.className = "button remix-button sa-remix-button";

    const remixButtonAlt = addon.tab.scratchMessage("project.remixButton.altText");
    button.setAttribute("title", remixButtonAlt);
    button.setAttribute("alt", remixButtonAlt);
    button.addEventListener("click", (e) => {
      redux.dispatch({
        type: "scratch-gui/project-state/START_REMIXING",
      });
      redux.dispatch({
        type: "RESET_COMMENTS",
      });

      button.classList.add("remixing", "disabled");
    });

    const inner = document.createElement("span");
    inner.innerText = addon.tab.scratchMessage("project.remixButton");

    button.append(inner);

    addon.tab.appendToSharedSpace({ space: "beforeRemixButton", element: button, order: 9 });
    addon.tab.displayNoneWhileDisabled(button);
  }
}
