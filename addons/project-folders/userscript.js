export default async function ({ addon, global, console, msg }) {
  const projects = await (await fetch("https://scratch.mit.edu/site-api/projects/all")).json();

  async function loadFolders() {
    const folders = [];
    const folderDiv = document.querySelectorAll("div.folders")[0];
    const token = await addon.auth.fetchXToken();
    const projectDetails = await Promise.all(
      projects.map(async (project) => {
        const data = await (
          await fetch(`https://api.scratch.mit.edu/projects/${project.pk}`, {
            headers: {
              "content-type": "application/json",
              "x-csrftoken": addon.auth.crsfToken,
              "x-token": token,
            },
          })
        ).json();
        return data;
      })
    );
    projectDetails.forEach((project) => {
      const instructions = project.instructions.split("\n");
      const folder = instructions.filter((element) => {
        if (element.includes("#_")) {
          return true;
        }
      });
      if (folder.length === 0) return;

      for (let j = 0; j < folder.length; j++) {
        const matches = folders.filter((element) => {
          return element.name === folder[j].replace("#_", "");
        });

        if (matches.length === 0) {
          folders.push({
            name: folder[j].replace("#_", ""),
            projects: [{ name: project.title, id: project.id, thumbnail: project.image }],
          });
        } else {
          folders[folders.indexOf(matches[0])].projects.push({
            name: project.title,
            id: project.id,
            thumbnail: project.image,
          });
        }
      }
    });

    if (folders.length === 0) folderDiv.childNodes[0].textContent = msg("noFolder");
    else folderDiv.childNodes[0].remove();

    for (let i = 0; i < folders.length; i++) createFolder(folders[i].name, JSON.stringify(folders[i]));
  }

  function createFolderAreaAndButton(projectColumns) {
    const folderDiv = document.createElement("div");
    folderDiv.className = "folders-container";
    projectColumns.insertBefore(folderDiv, projectColumns.childNodes[0]);

    const folderHeader = document.createElement("h4");
    folderHeader.textContent = msg("header");
    folderHeader.className = "folder-header";
    folderDiv.appendChild(folderHeader);

    const realFolderDiv = document.createElement("div");
    realFolderDiv.className = "folders";
    folderDiv.appendChild(realFolderDiv);

    const textSpan = document.createElement("span");
    textSpan.textContent = msg("loading");
    realFolderDiv.appendChild(textSpan);

    realFolderDiv.appendChild(document.createElement("br"));

    const projectHeader = document.createElement("h4");
    projectHeader.textContent = msg("projectHeader");
    projectColumns.insertBefore(projectHeader, projectColumns.childNodes[1]);
  }

  function createFolder(name, folderdata) {
    const folderDiv = document.querySelectorAll(".folders")[0];

    const noFolderSpan = document.querySelectorAll(".folders>.no-folder")[0];
    if (noFolderSpan !== undefined) {
      noFolderSpan.remove();
    }

    const folder = document.createElement("button");
    folder.className = "folder";
    folder.setAttribute("folder-data", folderdata);
    folderDiv.appendChild(folder);

    const image = document.createElement("img");
    image.className = "folder-image";
    image.src = addon.self.dir + "/folder.svg";
    folder.appendChild(image);

    folder.appendChild(document.createElement("br"));

    const folderName = document.createElement("span");
    folderName.textContent = name;
    folder.appendChild(folderName);

    folder.addEventListener("click", async () => {
      const { backdrop, content, closeButton, remove } = addon.tab.createModal(folderName.textContent, {
        isOpen: true,
        useEditorClasses: true,
      });

      const folderData = JSON.parse(folder.getAttribute("folder-data"));

      closeButton.addEventListener("click", remove);
      backdrop.addEventListener("click", remove);

      const projectDiv = document.createElement("div");
      projectDiv.classList.add("sa-folder-projects");
      content.appendChild(projectDiv);

      for (let i = 0; i < folderData.projects.length; i++) {
        const project = document.createElement("div");
        project.classList.add("project");
        projectDiv.appendChild(project);

        const projectIMG = document.createElement("img");
        projectIMG.classList.add("sa-folder-project-img");
        projectIMG.src = folderData.projects[i].thumbnail;
        project.appendChild(projectIMG);

        const projectLink = document.createElement("a");
        projectLink.href = `https://scratch.mit.edu/projects/${folderData.projects[i].id}`;
        projectLink.textContent = folderData.projects[i].name;
        project.appendChild(projectLink);
      }
    });
  }

  while (true) {
    const projectColumns = await addon.tab.waitForElement("ul.media-list", {
      markAsSeen: true,
    });
    createFolderAreaAndButton(projectColumns);
    loadFolders();
  }
}
