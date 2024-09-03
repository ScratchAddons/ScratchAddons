export default async function ({ addon, console }) {
  const projectId = window.location.pathname.split("/")[2];
  const thumbUrl = `https://uploads.scratch.mit.edu/get_image/project/${projectId}_480x360.png`;
  const thumb = document.createElement("img");
  thumb.src = thumbUrl;
  thumb.className = "sa-project-thumb";

  const stageWrapper = await addon.tab.waitForElement('div[class*="stage-wrapper_stage-wrapper_"]');
  const alerts = document.querySelector(".project-info-alerts");

  const loaderBackground = stageWrapper.querySelector('[class*="loader_background_"]');
  if (addon.tab.editorMode === "fullscreen") {
    document.body.classList.add("sa-body-fullscreen");
  }

  thumb.classList.add("loading");
  stageWrapper.insertBefore(thumb, loaderBackground);
  if (alerts) alerts.style.display = "none";

  addon.tab.redux.initialize();
  addon.tab.redux.addEventListener("statechanged", (e) => {
    if (e.detail.action.type == "scratch-gui/project-changed/SET_PROJECT_CHANGED") {
      if (addon.tab.editorMode !== "editor") {
        // Move the thumbnail after the project loads
        thumb.classList.remove("loading");
        const stage = document.querySelector('div[class*="stage_stage"]');
        const greenFlagOverlay = stage.querySelector('[class*="stage_green-flag-overlay-wrapper_"]');
        stage.insertBefore(thumb, greenFlagOverlay);
        if (alerts) alerts.style.display = "flex";
      } else if (addon.tab.redux.state.scratchGui.projectState.loadingState === "SHOWING_WITH_ID") {
        thumb.remove();
      }
    }
    if (e.detail.action.type == "scratch-gui/vm-status/SET_STARTED_STATE") {
      thumb.remove();
    }
  });

  addon.tab.displayNoneWhileDisabled(thumb);

  addon.tab.addEventListener("urlChange", (e) => {
    if (addon.tab.editorMode === "fullscreen") {
      document.body.classList.add("sa-body-fullscreen");
    } else {
      document.body.classList.remove("sa-body-fullscreen");
    }
  });
}
