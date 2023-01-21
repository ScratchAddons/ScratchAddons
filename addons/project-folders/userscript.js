export default async function ({ addon, global, console, msg }) {
  let projectColumns;
  projectColumns = await addon.tab.waitForElement("ul.media-list", {
    markAsSeen: true,
  });

  let foldersArray;
  const projectTab = document.querySelectorAll("li.first")[0];
  projectTab.childNodes[0].onclick = async () => {
    projectColumns = await addon.tab.waitForElement("ul.media-list", {
      markAsSeen: true,
    });
    createFolderAreaAndButton();
    foldersArray = await load();
  };
  
  if (document.querySelectorAll("div.folders-container")[0] === undefined) {
    createFolderAreaAndButton();
    foldersArray = await load();
  }

  async function getProjectDetails(projectID) {
    const token = await addon.auth.fetchXToken();
    const projectDetails = await (
      await fetch(`https://api.scratch.mit.edu/projects/${projectID}/`, {
        headers: {
          "content-type": "application/json",
          "x-csrftoken": addon.auth.crsfToken,
          "x-token": token,
        },
      })
    ).json();

    return projectDetails;
  }

  async function load() {
    const folders = [];

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

    for (let i = 0; i < projectColumns.childNodes.length - 2; i++) {
      loader.setAttribute("value", (i / (projectColumns.childNodes.length - 2)) * 100);

      const link = projectColumns.childNodes[i + 2].childNodes[1].childNodes[3].childNodes[1].childNodes[0].href;
      const projectID = link.replace("https://scratch.mit.edu/projects/", "").replace("/", "");
      const projectDetails = await getProjectDetails(projectID);
      let instructions = projectDetails.instructions;

      if (instructions.includes("#_")) {
        instructions = instructions.split("\n");

        for (let j = 0; j < instructions.length; j++) {
          if (instructions[j].includes("#_")) {
            let folderExists = false;
            for (let k = 0; k < folders.length; k++) {
              if (folders[k].name === instructions[j].replace("#_", "")) {
                folders[k].projects.push({ link: link, name: projectDetails.title });
                folderExists = true;
                break;
              }
            }

            if (folderExists === false) {
              folders.push({
                name: instructions[j].replace("#_", ""),
                projects: [{ link: link, name: projectDetails.title }],
              });
            }
          }
        }
      }
    }

    loader.setAttribute("value", "100");

    loader.remove();
    tempBR.remove();

    if (folders.length === 0) {
      noFolderSpan.textContent = msg("noFolder");
    } else {
      noFolderSpan.remove();
    }

    for (let k = 0; k < folders.length; k++) {
      createFolder(folders[k].name);
    }

    return folders;
  }

  function createFolderAreaAndButton() {
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

    let projectHeader = document.createElement("h4");
    projectHeader.textContent = msg("projectHeader");
    projectColumns.insertBefore(projectHeader, projectColumns.childNodes[1]);
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

    folder.addEventListener("click", async () => {
      const { backdrop, container, content, closeButton, remove } = addon.tab.createModal(folderName.textContent, {
        isOpen: true,
        useEditorClasses: true,
      });

      closeButton.addEventListener("click", remove);
      backdrop.addEventListener("click", remove);

      const projectDiv = document.createElement("div");
      projectDiv.classList.add("sa-folder-projects");
      content.appendChild(projectDiv);

      const folders = foldersArray;
      let projects;
      for (let i = 0; i < folders.length; i++) {
        if (folders[i].name === folderName.textContent) {
          projects = folders[i].projects;
          break;
        }
      }

      for (let i = 0; i < projects.length; i++) {
        const projectID = projects[i].link.replace("https://scratch.mit.edu/projects/", "").replace("/", "");

        const project = document.createElement("div");
        project.classList.add("project");
        projectDiv.appendChild(project);

        const img = document.createElement("img");
        img.src = `https://uploads.scratch.mit.edu/get_image/project/${projectID}_200x160.png`;
        img.classList.add("sa-folder-project-img");
        project.appendChild(img);

        project.appendChild(document.createElement("br"));

        const projectLink = document.createElement("a");
        projectLink.textContent = projects[i].name;
        projectLink.href = projects[i].link;
        project.appendChild(projectLink);
      }
    });
  }
}
