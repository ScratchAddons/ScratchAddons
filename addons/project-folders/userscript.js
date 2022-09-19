export default async function ({ addon, global, console, msg }) {
  let projectColumns = await addon.tab.waitForElement("ul.media-list", {
    markAsSeen: true,
  });

  createFolderAreaAndButton();
  load();

  async function load() {
    let folders = [];

    let folderDiv = document.querySelectorAll(".folders")[0];

    let noFolderSpan = document.createElement("span");
    noFolderSpan.textContent = msg("loading");
    folderDiv.appendChild(noFolderSpan);

    let tempBR = document.createElement("br");
    folderDiv.appendChild(tempBR);

    let loader = document.createElement("progress");
    loader.setAttribute("value", "0");
    loader.setAttribute("max", "100");
    folderDiv.appendChild(loader);

    for (let i = 0; i < projectColumns.childNodes.length; i++) {
      loader.setAttribute("value", (i / projectColumns.childNodes.length) * 100);

      let link = projectColumns.childNodes[i].childNodes[1].childNodes[3].childNodes[1].childNodes[0].href;
      let projectID = link.replace("https://scratch.mit.edu/projects/", "");
      projectID = projectID.replace("/", "");
      let token = await addon.auth.fetchXToken();
      let projectDetails = await fetch(`https://api.scratch.mit.edu/projects/${projectID}/`, {
        headers: {
          "content-type": "application/json",
          "x-csrftoken": addon.auth.crsfToken,
          "x-token": token,
        },
      });
      projectDetails = await projectDetails.json();
      let instructions = projectDetails.instructions;

      if (instructions.includes("#_")) {
        let folderTag = false;
        let folderName = "";
        for (let j = 0; j < instructions.length; j++) {
          if ((instructions[j] === "#" && instructions[j + 1] === "_") || folderTag) {
            folderTag = true;
          } else {
            folderTag = false;
          }

          if (folderTag) {
            if (instructions[j + 2] != undefined) {
              folderName = `${folderName}${instructions[j + 2]}`;
            }
          }
        }

        if (folderName != "") {
          folders.push(folderName);
        }
      }
    }

    loader.setAttribute("value", "100");

    if (folders.length === 0) {
      noFolderSpan.textContent = msg("noFolder");
    } else {
      noFolderSpan.remove();
    }

    loader.remove();
    tempBR.remove();

    for (let k = 0; k < folders.length; k++) {
      createFolder(folders[k]);
    }
  }

  function createFolderAreaAndButton() {
    let columns = document.querySelectorAll(".col-12")[0];
    let folderDiv = document.createElement("div");
    folderDiv.className = "folders-container";
    columns.insertBefore(folderDiv, columns.childNodes[0]);

    let folderHeader = document.createElement("h4");
    folderHeader.textContent = msg("header");
    folderHeader.className = "folder-header";
    folderDiv.appendChild(folderHeader);

    let realFolderDiv = document.createElement("div");
    realFolderDiv.className = "folders";
    folderDiv.appendChild(realFolderDiv);

    let projectHeader = document.createElement("h4");
    projectHeader.textContent = msg("projectHeader");
    columns.insertBefore(projectHeader, columns.childNodes[1]);

    let buttonArea = document.querySelectorAll(".buttons")[0];
    let newFolderButton = document.createElement("button");
    newFolderButton.className = "button small grey";
    buttonArea.appendChild(newFolderButton);

    let newFolderSpan = document.createElement("span");
    newFolderSpan.textContent = msg("createFolder");
    newFolderButton.appendChild(newFolderSpan);

    newFolderButton.addEventListener("click", () => {
      let folderName = prompt(msg("folderNamePrompt"));
      createFolder(folderName);
    });
  }

  function createFolder(name) {
    let folderDiv = document.querySelectorAll(".folders")[0];

    let noFolderSpan = document.querySelectorAll(".folders>.no-folder")[0];
    if (noFolderSpan !== undefined) {
      noFolderSpan.remove();
    }

    let folder = document.createElement("button");
    folder.className = "folder";
    folderDiv.appendChild(folder);

    let image = document.createElement("img");
    image.className = "folder-image";
    image.src = addon.self.dir + "/folder.svg";
    folder.appendChild(image);

    folder.appendChild(document.createElement("br"));

    let folderName = document.createElement("span");
    folderName.textContent = name;
    folder.appendChild(folderName);

    folder.addEventListener("click", () => {
      let { backdrop, container, content, closeButton, remove } = addon.tab.createModal(folderName.textContent, {
        isOpen: true,
      });

      closeButton.addEventListener("click", remove);
    });
  }
}
