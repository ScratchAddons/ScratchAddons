export default async function ({ addon, global, console, msg }) {
  let pendingReplacement = false;
  const replace = async () => {
    // Current loadingState is LOADING_VM_NEW_DEFAULT

    if (pendingReplacement) {
      // Never happens AFAIK
      console.log("Pending replacement");
      return;
    }
    pendingReplacement = true;

    const isLoggedIn = await addon.auth.fetchIsLoggedIn();
    if (isLoggedIn) {
      await addon.tab.redux.waitForState((state) => state.scratchGui.projectState.loadingState === "SHOWING_WITH_ID");
    } else {
      // If the user is logged out, SHOWING_WITHOUT_ID will be the last state.
      await addon.tab.redux.waitForState(
        (state) => state.scratchGui.projectState.loadingState === "SHOWING_WITHOUT_ID"
      );
    }

    const projectId = addon.settings.get("projectId");
    if (projectId !== 510186917) addon.tab.traps.vm.downloadProjectId(projectId);
    pendingReplacement = false;
  };

  if (addon.tab.redux.state.scratchGui.projectState.loadingState === "LOADING_VM_NEW_DEFAULT") replace();

  addon.tab.redux.initialize();
  addon.tab.redux.addEventListener("statechanged", async (e) => {
    if (e.detail.action.type === "scratch-gui/project-state/DONE_FETCHING_DEFAULT") replace();
  });
}
