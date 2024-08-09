export default async function ({ addon, console }) {
  if (addon.tab.editorMode === "editor") return;

  const projectId = window.location.pathname.split("/")[2];
  const thumbUrl = `https://uploads.scratch.mit.edu/get_image/project/${projectId}_480x360.png`;
  const thumb = document.createElement("img");
  thumb.src = thumbUrl;
  thumb.id = "sa-project-thumb";
  thumb.className = "sa-project-thumb";

  const stageWrapper = await addon.tab.waitForElement('div[class*="stage-wrapper_stage-wrapper_"]');
  const alerts = document.querySelector(".project-info-alerts");

  if (addon.settings.get("loading") && !(addon.tab.editorMode === "fullscreen")) {
    const LoaderBackground = stageWrapper.querySelector('[class*="loader_background_"]');
    // Set with JS to ensure the background color doesn't change before the image loads
    LoaderBackground.style.backgroundColor = "rgba(0, 0, 0, 0.25)";
    thumb.classList.add("sa-project-thumb-loading");
    stageWrapper.insertBefore(thumb, LoaderBackground);
    alerts.style.display = "none";
  }

  addon.tab.redux.initialize();
  addon.tab.redux.addEventListener("statechanged", (e) => {
    if (e.detail.action.type == "scratch-gui/project-changed/SET_PROJECT_CHANGED") {
      // Move the thumbnail after the project loads
      thumb.classList.remove("sa-project-thumb-loading");
      const stage = document.querySelector('div[class*="stage_stage"]');
      const greenFlagOverlay = stage.querySelector('[class*="stage_green-flag-overlay-wrapper_"]');
      stage.insertBefore(thumb, greenFlagOverlay);
      alerts.style.display = "flex";
    }
    if (e.detail.action.type == "scratch-gui/vm-status/SET_STARTED_STATE") {
      document.getElementById("sa-project-thumb").remove();
    }
  });

  addon.tab.displayNoneWhileDisabled(thumb, {
    display: "inline",
  });
}
