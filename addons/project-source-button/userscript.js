export default async function ({ addon, global, console, msg }) {
  function getFilePath(path) {
    let addonPath = addon.__path;
    if (addonPath.at(-1) !== "/") {
      addonPath += "/";
    }
    if (path[0] !== "/") {
      path = "/" + path;
    }
    return addonPath + "addons/" + addon._addonId + path;
  }
  //get project's public status
  const isPublic = addon.tab.redux.state.preview.projectInfo.public;
  //get project id
  const projectId = window.location.pathname.split("/")[2];
  async function getToken() {
    let projectToken;
    if (!isPublic) {
      projectToken = (
        await (
          await fetch(`https://api.scratch.mit.edu/projects/${projectId}?nocache=${Date.now()}`, {
            headers: { "x-token": await addon.auth.fetchXToken() },
            mode: "cors",
          })
        ).json()
      ).project_token;
    } else {
      projectToken = (
        await (
          await fetch(`https://api.scratch.mit.edu/projects/${projectId}?nocache=${Date.now()}`, {
            mode: "cors",
          })
        ).json()
      ).project_token;
    }
    return projectToken;
  }

  const prjBtnEvt = setInterval((e) => {
    if (document.getElementsByClassName("flex-row action-buttons")[0]) {
      clearInterval(prjBtnEvt);
      setup();
    }
  }, 100);
  async function setup() {
    const icon = document.createElement("button");
    icon.id = "view-json-btn";
    icon.title = msg("hover");
    icon.textContent=msg("open");
    const pjtBtns = document.getElementsByClassName("flex-row action-buttons")[0];
    
    pjtBtns.prepend(icon);
    let msgs = {};
    ["edit_warn", "please_reopen"].forEach((elem) => {
      msgs[elem] = msg(elem);
    });
    document.getElementById("view-json-btn").addEventListener("click", async (e) => {
      let projectToken;
      try {
        projectToken = await getToken();
      } catch (e) {
        if (window.confirm(msg("json_fetch_err"))) {
          location.reload();
        }
      }
      const viewer = window.open(
        getFilePath("viewer.html") +
          `?id=${projectId}&token=${projectToken}&maxlines=${addon.settings.get("max_lines")}#${JSON.stringify(msgs)}`
      );
    });
  }
}
