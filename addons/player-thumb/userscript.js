export default async function ({ addon, console }) {
  if (addon.tab.editorMode === "editor") return;

  const projectId = location.pathname.split("/")[2];
  const thumb = document.createElement("img");
  thumb.src = `https://uploads.scratch.mit.edu/get_image/project/${projectId}_480x360.png`;
  thumb.classList = "sa-project-thumb loading";

  const stageWrapper = await addon.tab.waitForElement('div[class*="stage-wrapper_stage-wrapper_"]');
  const alerts = document.querySelector(".project-info-alerts");
  const controls = stageWrapper.querySelector('div[class^="controls_controls-container_"]');
  controls.classList.add("sa-controls-disabled");

  const loaderBackground = stageWrapper.querySelector('[class*="loader_background_"]');
  stageWrapper.insertBefore(thumb, loaderBackground);
  alerts.style.display = "none";
  // Ensure thumbnail is injected before adding transparency
  loaderBackground.style.backgroundColor = "rgba(0, 0, 0, 0.25)";

  addon.tab.redux.initialize();

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
