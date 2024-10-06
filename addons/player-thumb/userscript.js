export default async function ({ addon, console }) {
  const projectId = location.pathname.split("/")[2];

  const thumb = document.createElement("img");
  thumb.src = `https://uploads.scratch.mit.edu/get_image/project/${projectId}_480x360.png`;
  thumb.classList = "sa-project-thumb loading";

  let controls, alerts;

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
        stage.insertBefore(thumb, greenFlagOverlay);
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
      reduxCondition: (state) =>
        state.scratchGui.mode.isPlayerOnly && state.scratchGui.projectState.loadingState !== "SHOWING_WITH_ID",
    });
    alerts = document.querySelector(".project-info-alerts");
    controls = stageWrapper.querySelector('div[class^="controls_controls-container_"]');
    controls.classList.add("sa-controls-disabled");

    const loaderBackground = stageWrapper.querySelector('[class*="loader_background_"]');
    stageWrapper.insertBefore(thumb, loaderBackground);
    if (alerts) alerts.style.display = "none";
    // Ensure thumbnail is injected at least once before adding transparency
    loaderBackground.style.backgroundColor = "rgba(0, 0, 0, 0.25)";
  }
}
