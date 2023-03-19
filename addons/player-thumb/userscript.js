export default async function ({ addon, console }) {
  if (addon.tab.editorMode === "editor") return;
  const stage = await addon.tab.waitForElement('div[class*="stage_stage"]', {
    markAsSeen: true,
  });
  const greenFlagOverlay = stage.querySelector('[class*="stage_green-flag-overlay-wrapper_"]');

  const projectId = window.location.pathname.split("/")[2];
  const thumbUrl = `https://uploads.scratch.mit.edu/get_image/project/${projectId}_480x360.png`;
  const thumb = document.createElement("img");
  thumb.src = thumbUrl;
  thumb.id = "sa-project-thumb";
  thumb.classList.add("sa-project-thumb");
  stage.insertBefore(thumb, greenFlagOverlay);

  addon.tab.redux.initialize();
  addon.tab.redux.addEventListener("statechanged", (e) => {
    if (e.detail.action.type == "scratch-gui/vm-status/SET_STARTED_STATE") {
      document.getElementById("sa-project-thumb").remove();
    }
  });

  addon.tab.displayNoneWhileDisabled(thumb, {
    display: "inline",
  });
}
