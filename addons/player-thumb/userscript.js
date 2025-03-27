export default async function ({ addon, console }) {
  if (addon.tab.editorMode === "editor") return;

  const projectId = location.pathname.split("/")[2];
  const thumb = document.createElement("img");
  thumb.src = `https://uploads.scratch.mit.edu/get_image/project/${projectId}_480x360.png`;
  thumb.classList = "sa-project-thumb loading";
  thumb.draggable = false;

  const stageWrapper = await addon.tab.waitForElement('div[class*="stage-wrapper_stage-wrapper_"]');
  addon.tab.redux.initialize();

  // It's possible this runs after the project loads even without dynamic enable
  if (addon.tab.redux.state?.scratchGui?.projectState?.loadingState === "SHOWING_WITH_ID") return;

  const alerts = document.querySelector(".project-info-alerts");
  const controls = stageWrapper.querySelector('div[class^="controls_controls-container_"]');
  controls.classList.add("sa-controls-disabled");

  const loaderBackground = stageWrapper.querySelector('[class*="loader_background_"]');
  stageWrapper.insertBefore(thumb, loaderBackground);
  alerts.style.display = "none";
  loaderBackground.classList.add("sa-loader-background");

  addon.tab.addEventListener("urlChange", () => {
    loaderBackground.classList.add("sa-loader-background");
  });

  function handleStateChange(e) {
    if (e.detail.action.type === "scratch-gui/project-changed/SET_PROJECT_CHANGED") {
      // Move the thumbnail after the project loads
      thumb.classList.remove("loading");
      controls.classList.remove("sa-controls-disabled");
      const stage = document.querySelector('div[class*="stage_stage"]');
      const greenFlagOverlay = stage.querySelector('[class*="stage_green-flag-overlay-wrapper_"]');
      stage.insertBefore(thumb, greenFlagOverlay);
      alerts.style.display = "flex";
    }
    if (e.detail.action.type === "scratch-gui/vm-status/SET_STARTED_STATE") {
      thumb.remove();
      addon.tab.redux.removeEventListener("statechanged", handleStateChange);
    }
  }

  addon.tab.redux.addEventListener("statechanged", handleStateChange);
}
