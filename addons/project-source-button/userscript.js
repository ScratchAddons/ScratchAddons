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
      let token = "";
      if (addon.tab.redux.state?.preview?.projectInfo?.public === false) {
        let projectToken = (
          await (
            await fetch(`https://api.scratch.mit.edu/projects/${projectId}?nocache=${Date.now()}`, {
              headers: {
                "x-token": await addon.auth.fetchXToken(),
              },
            })
          ).json()
        ).project_token;
        token = `?token=${projectToken}`;
      }

      const viewer = window.open(`https://inspector.grahamsh.com/projects/${projectId}${token}`);
    });
  }
}
