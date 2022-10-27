export default async function ({ addon, global, console, msg }) {
  const projectColumns = await addon.tab.waitForElement("ul.media-list", {
    markAsSeen: true,
  });

  createFolderAreaAndButton();
  load();

  async function load() {
    const foldersJSON = { folders: [] };

    const folderDiv = document.querySelectorAll(".folders")[0];

    const noFolderSpan = document.createElement("span");
    noFolderSpan.textContent = msg("loading");
    folderDiv.appendChild(noFolderSpan);

    const tempBR = document.createElement("br");
    folderDiv.appendChild(tempBR);

    const loader = document.createElement("progress");
    loader.setAttribute("value", "0");
    loader.setAttribute("max", "100");
    folderDiv.appendChild(loader);

    for (let i = 0; i < projectColumns.childNodes.length; i++) {
      loader.setAttribute("value", (i / projectColumns.childNodes.length) * 100);

      const link = projectColumns.childNodes[i].childNodes[1].childNodes[3].childNodes[1].childNodes[0].href;
      const projectID = link.replace("https://scratch.mit.edu/projects/", "").replace("/", "");
      const token = await addon.auth.fetchXToken();
      const projectDetails = await (await fetch(`https://api.scratch.mit.edu/projects/${projectID}/`, {
        headers: {
          "content-type": "application/json",
          "x-csrftoken": addon.auth.crsfToken,
          "x-token": token,
        },
      })).json();
      let instructions = projectDetails.instructions;

      if (instructions.includes("#_")) {
        instructions = instructions.split('\n');

        for (let j = 0; j < instructions.length; j++) {
          if (instructions[j].includes('#_')) {
            if (!foldersJSON.folders.includes(instructions[j].replace('#_', ''))) {
              foldersJSON.folders.push({ name: instructions[j].replace('#_', ''), projects: [link] });
            } else {
              for (let l = 0; l < foldersJSON.folders.length; l++) {
                if (foldersJSON.folders[l] === instructions[j].replace('#_', '')) {
                  foldersJSON.folders[l].projects.push(link);
                }
              }
            }
          }
        }
      }
    }

    loader.setAttribute("value", "100");

    loader.remove();
    tempBR.remove();

    if (foldersJSON.folders.length === 0) {
      noFolderSpan.textContent = msg("noFolder");
    } else {
      noFolderSpan.remove();
    }

    for (let k = 0; k < foldersJSON.folders.length; k++) {
      createFolder(foldersJSON.folders[k].name);
    }
  }

  function createFolderAreaAndButton() {
    const columns = document.querySelectorAll(".col-12")[0];
    const folderDiv = document.createElement("div");
    folderDiv.className = "folders-container";
    columns.insertBefore(folderDiv, columns.childNodes[0]);

    const folderHeader = document.createElement("h4");
    folderHeader.textContent = msg("header");
    folderHeader.className = "folder-header";
    folderDiv.appendChild(folderHeader);

    const realFolderDiv = document.createElement("div");
    realFolderDiv.className = "folders";
    folderDiv.appendChild(realFolderDiv);

    const projectHeader = document.createElement("h4");
    projectHeader.textContent = msg("projectHeader");
    columns.insertBefore(projectHeader, columns.childNodes[1]);

    const buttonArea = document.querySelectorAll(".buttons")[0];
    const newFolderButton = document.createElement("button");
    newFolderButton.className = "button small grey";
    buttonArea.appendChild(newFolderButton);

    const newFolderSpan = document.createElement("span");
    newFolderSpan.textContent = msg("createFolder");
    newFolderButton.appendChild(newFolderSpan);

    newFolderButton.addEventListener("click", () => {
      const folderName = prompt(msg("folderNamePrompt"));
      if (folderName !== '') {
        createFolder(folderName);
      }
    });
  }

  function createFolder(name) {
    const folderDiv = document.querySelectorAll(".folders")[0];

    const noFolderSpan = document.querySelectorAll(".folders>.no-folder")[0];
    if (noFolderSpan !== undefined) {
      noFolderSpan.remove();
    }

    const folder = document.createElement("button");
    folder.className = "folder";
    folderDiv.appendChild(folder);

    const image = document.createElement("img");
    image.className = "folder-image";
    image.src = addon.self.dir + "/folder.svg";
    folder.appendChild(image);

    folder.appendChild(document.createElement("br"));

    const folderName = document.createElement("span");
    folderName.textContent = name;
    folder.appendChild(folderName);

    folder.addEventListener("click", () => {
      const { backdrop, container, content, closeButton, remove } = addon.tab.createModal(folderName.textContent, {
        isOpen: true,
        useEditorClasses: true,
      });

      closeButton.addEventListener("click", remove);
      backdrop.addEventListener('click', remove);

      const projectDiv = document.createElement('div');
      projectDiv.classList.add('sa-folder-projects');
      content.appendChild()
    });
  }
}
