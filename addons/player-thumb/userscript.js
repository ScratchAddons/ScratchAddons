export default async function ({ addon, console }) {
  if (addon.tab.editorMode === "editor") return;

  const projectId = window.location.pathname.split("/")[2];
  const thumbUrl = `https://uploads.scratch.mit.edu/get_image/project/${projectId}_480x360.png`;
  const thumb = document.createElement("img");
  thumb.src = thumbUrl;
  thumb.id = "sa-project-thumb";
  thumb.classList.add("sa-project-thumb");

  const stageWrapper = await addon.tab.waitForElement('div[class*="stage-wrapper_stage-wrapper_2bejr box_box_2jjDp"]', {
    markAsSeen: true,
  });

  if (addon.settings.get("loading")) {
    const LoaderBackground = stageWrapper.querySelector('[class*="loader_background_"]');
    stageWrapper.insertBefore(thumb, LoaderBackground);
    thumb.classList.add("sa-project-thumb-loading");
  }

  addon.tab.redux.initialize();
  addon.tab.redux.addEventListener("statechanged", (e) => {
    if (e.detail.action.type == "scratch-gui/project-changed/SET_PROJECT_CHANGED") {
      moveThumb();
      // TODO: Remove listener
    }
    if (e.detail.action.type == "scratch-gui/vm-status/SET_STARTED_STATE") {
      document.getElementById("sa-project-thumb").remove();
    }
  });

  function moveThumb() {
    // Since the loading screen has a different size and layer
    // just remove the thumbnail and re-add it in the correct place
    thumb.classList.remove("sa-project-thumb-loading");
    document.getElementById("sa-project-thumb").remove();
    const stage = document.querySelector('div[class*="stage_stage"]');
    const greenFlagOverlay = stage.querySelector('[class*="stage_green-flag-overlay-wrapper_"]');
    stage.insertBefore(thumb, greenFlagOverlay);
  }

  addon.tab.displayNoneWhileDisabled(thumb, {
    display: "inline",
  });
}
