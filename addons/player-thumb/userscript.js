export default async function ({ addon, console }) {
  const stage = await addon.tab.waitForElement('div[class*="stage_stage"]', {
    markAsSeen: true,
  });

  const projectId = window.location.pathname.split("/")[2];
  const thumbUrl = `https://uploads.scratch.mit.edu/get_image/project/${projectId}_480x360.png`;
  const thumb = document.createElement("img");
  thumb.src = thumbUrl;
  thumb.id = "sa-project-thumb";
  thumb.classList.add("sa-project-thumb");
  stage.appendChild(thumb);

  addon.tab.redux.initialize();
  addon.tab.redux.addEventListener("statechanged", (e) => {
    if (e.detail.action.type == "scratch-gui/vm-status/SET_STARTED_STATE") {
      console.log("hide thumb");
      document.getElementById("sa-project-thumb").remove();
    }
  });

  addon.tab.displayNoneWhileDisabled(thumb, {
    display: "inline",
  });
}
