export default async function ({ addon, console, msg }) {
  // Fetch as text without parsing as JSON, because guess what,
  // the code will stringify anyway!
  const emptyProjectPromise = fetch(`${addon.self.dir}/default.json`).then((res) => res.text());

  let pendingReplacement = false;

  let reduxAvailable = Boolean(addon.tab.redux.state);
  while (!reduxAvailable) {
    await new Promise((resolve) => {
      setTimeout(() => {
        reduxAvailable = Boolean(addon.tab.redux.state);
        resolve();
      }, 0);
    });
  }

  addon.tab.redux.initialize();
  let isFileUpload = false;
  addon.tab.redux.addEventListener("statechanged", async (e) => {
    if (e.detail.action.type === "scratch-gui/project-state/DONE_LOADING_VM_WITHOUT_ID") {
      // Current loadingState is SHOWING_WITHOUT_ID

      if (pendingReplacement) {
        // Never happens AFAIK
        console.log("Pending replacement");
        return;
      }
      pendingReplacement = true;

      let expired = false; // So that nothing goes catastrophically wrong
      setTimeout(() => (expired = true), 10000);

      const isLoggedIn = await addon.auth.fetchIsLoggedIn();
      if (isLoggedIn) {
        await addon.tab.redux.waitForState((state) => state.scratchGui.projectState.loadingState === "CREATING_NEW");
        await addon.tab.redux.waitForState((state) => state.scratchGui.projectState.loadingState === "SHOWING_WITH_ID");
        await addon.tab.redux.waitForState((state) => state.scratchGui.projectState.loadingState === "AUTO_UPDATING");
        await addon.tab.redux.waitForState((state) => state.scratchGui.projectState.loadingState === "SHOWING_WITH_ID");
        // By this point, vanilla new project was saved to cloud
      }

      const projectId = Number(addon.settings.get("projectId"));
      if (!expired && !isFileUpload) {
        switch (projectId) {
          case 510186917: // default project (do nothing)
            break;
          case 556445222: // empty project
            emptyProjectPromise.then((projectJsonText) => addon.tab.traps.vm.loadProject(projectJsonText));
            break;
          default: {
            if (typeof addon.tab.traps.vm.runtime?.storage?.setProjectToken === "function") {
              addon.auth
                .fetchXToken()
                .then((xToken) =>
                  fetch(`https://api.scratch.mit.edu/projects/${projectId}`, {
                    headers: {
                      "x-token": xToken,
                    },
                    credentials: "include",
                  })
                )
                .then((resp) => {
                  if (!resp.ok) throw new Error(`HTTP status code ${resp.status} returned`);
                  return resp.json();
                })
                .catch((exc) => console.error(`Fetching default project ${projectId} 's token failed`, exc))
                .then((resp) => {
                  if (resp?.project_token) {
                    addon.tab.traps.vm.runtime.storage.setProjectToken(resp.project_token);
                  }
                  addon.tab.traps.vm.downloadProjectId(projectId);
                });
            } else {
              addon.tab.traps.vm.downloadProjectId(projectId);
            }
          }
        }
      }
      pendingReplacement = false;
      isFileUpload = false;
    } else if (e.detail.action.type === "scratch-gui/project-state/START_LOADING_VM_FILE_UPLOAD") {
      // A file upload will then dispatch DONE_LOADING_VM_WITHOUT_ID, but we should ignore it
      isFileUpload = true;
    }
  });
}
