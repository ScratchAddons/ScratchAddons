export default async function ({ addon, console }) {

  let controls, alerts;

  const projectId = location.pathname.split("/")[2];
  if ((projectId) === "editor") return;

  const thumb = document.createElement("img");
  thumb.src = `https://uploads.scratch.mit.edu/get_image/project/${projectId}_480x360.png`;
  thumb.className = "sa-project-thumb";


  // TODO: Wait for Redux properly
  await addon.tab.waitForElement('div[class*="stage-wrapper_stage-wrapper_"]');
  addon.tab.redux.initialize();
  addon.tab.redux.addEventListener("statechanged", (e) => {
    if (e.detail.action.type == "scratch-gui/project-changed/SET_PROJECT_CHANGED") {
      // Move the thumbnail after the project loads
      thumb.classList.remove("loading");
      controls.classList.remove("sa-controls-disabled");
      const stage = document.querySelector('div[class*="stage_stage"]');
      const greenFlagOverlay = stage.querySelector('[class*="stage_green-flag-overlay-wrapper_"]');
      if (greenFlagOverlay) {
        stage.insertBefore(thumb, greenFlagOverlay)
        alerts.style.display = "flex";
      } else {
        thumb.remove();
      }
    }
    if (e.detail.action.type == "scratch-gui/vm-status/SET_STARTED_STATE") thumb.remove();
  });


  while (true) {
    const stageWrapper = await addon.tab.waitForElement('div[class*="stage-wrapper_stage-wrapper_"]', {
      markAsSeen: true,
      reduxCondition: (state) => state.scratchGui.mode.isPlayerOnly
    });
    if (addon.tab.redux.state?.scratchGui?.projectState?.loadingState === "SHOWING_WITH_ID") {
      controls.classList.remove("sa-controls-disabled");
      return;
    }
    alerts = document.querySelector(".project-info-alerts");
    controls = stageWrapper.querySelector('div[class^="controls_controls-container_"]');
    controls.classList.add("sa-controls-disabled");

    if (addon.tab.editorMode === "projectpage") {
      const LoaderBackground = stageWrapper.querySelector('[class*="loader_background_"]');
      LoaderBackground.style.backgroundColor = "rgba(0, 0, 0, 0.25)"; // Prevent style from being flashed on /projects/editor/
      thumb.classList.add("loading");
      stageWrapper.insertBefore(thumb, LoaderBackground);
      if (alerts) alerts.style.display = "none";
    }
  }
}
