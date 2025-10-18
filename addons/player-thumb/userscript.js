export default async function ({ addon, console }) {
  if (addon.tab.editorMode === "editor") return;

  const projectId = location.pathname.split("/")[2];
  document.documentElement.style.setProperty(
    "--thumb-src",
    `url(https://uploads.scratch.mit.edu/get_image/project/${projectId}_480x360.png)`
  );

  const stageWrapper = await addon.tab.waitForElement('div[class*="stage-wrapper_stage-wrapper_"]');
  addon.tab.redux.initialize();
  const controls = stageWrapper.querySelector('div[class^="controls_controls-container_"]');
  // Ensure the project has not already loaded when disabling the controls
  if (addon.tab.redux.state?.scratchGui?.projectState?.loadingState === "SHOWING_WITH_ID") return;
  controls.classList.add("sa-controls-disabled");
  const loaderBackground = stageWrapper.querySelector('[class*="loader_background_"]');
  loaderBackground.classList.add("sa-loader-background");

  addon.tab.addEventListener("urlChange", () => {
    loaderBackground.classList.add("sa-loader-background");
  });

  addon.tab.redux.addEventListener("statechanged", (e) => {
    if (e.detail.action.type === "scratch-gui/project-changed/SET_PROJECT_CHANGED") {
      controls.classList.remove("sa-controls-disabled");
    }
  });
}
