export default async function ({ addon, global, console, msg }) {

  while (true) {
    await addon.tab.waitForElement(".flex-row.action-buttons", { markAsSeen: true });
    const isPublic = addon.tab.redux.state.preview.projectInfo.public;

    if (isPublic) {
      setup();
    }
  }

  async function setup() {
    const projectId = window.location.pathname.split("/")[2];
    const icon = document.createElement("button");
    icon.id = "view-json-btn";
    icon.title = msg("hover");
    icon.textContent = msg("open");
    const pjtBtns = document.getElementsByClassName("flex-row action-buttons")[0];

    pjtBtns.prepend(icon);
    document.getElementById("view-json-btn").addEventListener("click", async (e) => {
      const viewer = window.open(`https://inspector.grahamsh.com/projects/${projectId}`);
    });
  }
}
