export default async function ({ addon, global, console, msg }) {
  const projectColumns = await addon.tab.waitForElement("ul.media-list", {
    markAsSeen: true,
  });

  createFolderAreaAndButton();
  const foldersJSON = await load();
  console.log(foldersJSON);

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
      const projectDetails = await getProjectDetails(projectID);
      let instructions = projectDetails.instructions;

      if (instructions.includes("#_")) {
        instructions = instructions.split("\n");

        for (let j = 0; j < instructions.length; j++) {
          if (instructions[j].includes("#_")) {
            let folderExists = false;
            for (let k = 0; k < foldersJSON.folders.length; k++) {
              if (foldersJSON.folders[k].name === instructions[j].replace('#_', '')) {
                foldersJSON.folders[k].projects.push(link);
                folderExists = true;
                break;
              }
            }

            if (folderExists === false) {
              foldersJSON.folders.push({ name: instructions[j].replace('#_', ''), projects: [link] });
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

    return foldersJSON;
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


    let projectHeader = document.createElement("h4");
    projectHeader.textContent = msg("projectHeader");
    columns.insertBefore(projectHeader, columns.childNodes[1]);
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

      const folders = foldersJSON.folders;
      let projects;
      for (let i = 0; i < folders.length; i++) {
        if (folders[i].name === folderName.textContent) {
          projects = folders[i].projects;
          break;
        }
      }

      for (let i = 0; i < projects.length; i++) {
        const projectID = projects[i].replace("https://scratch.mit.edu/projects/", "").replace("/", "");
        const projectDetails = await getProjectDetails(projectID);

        console.log(projectDetails);

        const project = document.createElement('div');
        project.classList.add('project');
        projectDiv.appendChild(project);

        const img = document.createElement('img');
        img.src = `https://uploads.scratch.mit.edu/get_image/project/${projectID}_200x160.png`;
        img.classList.add('sa-folder-project-img');
        project.appendChild(img);

        project.appendChild(document.createElement('br'));
        
        const projectLink = document.createElement('a');
        projectLink.textContent = projectDetails.title;
        projectLink.href = projects[i];
        project.appendChild(projectLink);
      }
    });
  }
}
