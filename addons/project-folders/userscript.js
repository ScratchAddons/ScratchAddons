export default async function ({ addon, global, console, msg }) {
  let projectColumns = await addon.tab.waitForElement("ul.media-list", {
    markAsSeen: true,
  });

  createData();
  createFolderAreaAndButton();
  load();

  function createData() {
    let folders = { Folders: [] };

    if (!localStorage.getItem("Folders")) {
      localStorage.setItem("Folders", JSON.stringify(folders));
    }
  }

  function load() {
    let folders = JSON.parse(localStorage.getItem("Folders"));

    for (let i = 0; i < folders.Folders.length; i++) {
      createFolder(folders.Folders[i].name);
    }

    if (folders.Folders.length === 0) {
      let folderDiv = document.querySelectorAll("div.folders")[0];
      let noFolderSpan = document.createElement("span");
      noFolderSpan.className = "no-folder";
      noFolderSpan.textContent = msg("noFolder");
      folderDiv.appendChild(noFolderSpan);
    }
  }

  function createFolderAreaAndButton() {
    let columns = document.querySelectorAll(".col-12")[0];
    let folderDiv = document.createElement("div");
    folderDiv.className = "folders";
    columns.insertBefore(folderDiv, columns.childNodes[0]);

    let folderHeader = document.createElement("h4");
    folderHeader.textContent = msg("header");
    folderHeader.className = "folder-header";
    folderDiv.appendChild(folderHeader);

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
      if (saveNewFolder(folderName)) {
        createFolder(folderName);
      }
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
      const { backdrop, container, content, closeButton, remove } = addon.tab.createModal(folderName.textContent, {
        isOpen: true,
        useEditorClasses: true,
      });

      backdrop.addEventListener("click", remove);

      closeButton.setAttribute("role", "button");
      closeButton.addEventListener("click", remove);

      let projectDiv = document.createElement("div");
      projectDiv.className = "projects";
      content.appendChild(projectDiv);

      let folders = JSON.parse(localStorage.getItem("Folders"));

      for (let i = 0; i < folders.Folders.length; i++) {
        if (folders.Folders[i].name === folderName.textContent) {
          for (let j = 0; j < folders.Folders[i].projects.length; j++) {
            let projectLink = folders.Folders[i].projects[j];
            createProjectElement(projectLink, folderName.textContent);
          }
        }
      }

      let addProjectBtn = document.createElement("button");
      addProjectBtn.className = "button";
      content.appendChild(addProjectBtn);

      let addProjectSpan = document.createElement("span");
      addProjectSpan.textContent = msg("addProject");
      addProjectBtn.appendChild(addProjectSpan);

      let folderRenameBtn = document.createElement("button");
      folderRenameBtn.className = "folder-rename-btn";
      content.appendChild(folderRenameBtn);

      let folderRenameSpan = document.createElement("span");
      folderRenameSpan.textContent = msg("folderRename");
      folderRenameBtn.appendChild(folderRenameSpan);

      let folderDeleteBtn = document.createElement("button");
      folderDeleteBtn.className = "folder-delete-btn";
      content.appendChild(folderDeleteBtn);

      let folderDeleteSpan = document.createElement("span");
      folderDeleteSpan.textContent = msg("folderDelete");
      folderDeleteBtn.appendChild(folderDeleteSpan);

      addProjectBtn.addEventListener("click", () => {
        let projectLink = prompt(msg("addProjectPrompt"), "https://scratch.mit.edu/projects/");
        addProjectToFolder(projectLink, folderName.textContent);
        createProjectElement(projectLink, folderName.textContent);
      });

      folderDeleteBtn.addEventListener("click", () => {
        remove();
        deleteFolder(folderName.textContent);
        folder.remove();
      });

      folderRenameBtn.addEventListener("click", () => {
        let newName = prompt(msg("renamePrompt"));
        renameFolder(folderName.textContent, newName);
        remove();
      });
    });
  }

  function saveNewFolder(folderName) {
    let folders = JSON.parse(localStorage.getItem("Folders"));

    if (folderName === "" || folderName === null) {
      alert(msg("emptyNameAlert"));
      return false;
    }

    for (let i = 0; i < folders.Folders.length; i++) {
      if (folders.Folders[i].name === folderName) {
        alert(msg("alreadyExistenceAlert"));
        return false;
        break;
      }
    }
    folders.Folders.push({ name: folderName, projects: [] });
    localStorage.setItem("Folders", JSON.stringify(folders));
    return true;
  }

  function addProjectToFolder(link, folder) {
    let folders = JSON.parse(localStorage.getItem("Folders"));

    for (let i = 0; i < folders.Folders.length; i++) {
      if (folders.Folders[i].name === folder) {
        if (link.includes("https://scratch.mit.edu/projects/")) {
          folders.Folders[i].projects.push(link);
          break;
        }
      }
    }

    localStorage.setItem("Folders", JSON.stringify(folders));
  }

  function deleteFolder(folder) {
    let folders = JSON.parse(localStorage.getItem("Folders"));

    for (let i = 0; i < folders.Folders.length; i++) {
      if (folders.Folders[i].name === folder) {
        folders.Folders.splice(i, 1);
      }
    }

    localStorage.setItem("Folders", JSON.stringify(folders));

    if (folders.Folders.length === 0) {
      let folderDiv = document.querySelectorAll("div.folders")[0];
      let noFolderSpan = document.createElement("span");
      noFolderSpan.className = "no-folder";
      noFolderSpan.textContent = msg("noFolder");
      folderDiv.appendChild(noFolderSpan);
    }
  }

  function createProjectElement(proLink, folderName) {
    let projectLink = proLink;
    let projectDiv = document.querySelectorAll(".projects")[0];

    let project = document.createElement("div");
    project.className = "project";
    projectDiv.appendChild(project);
    let projectLinkElement = document.createElement("a");
    projectLinkElement.href = projectLink;
    projectLinkElement.textContent = projectLink;
    project.appendChild(projectLinkElement);

    let projectDelButton = document.createElement("button");
    projectDelButton.className = "project-right-float-btn button small grey";
    project.appendChild(projectDelButton);

    let delImg = document.createElement("img");
    delImg.src = "https://scratch.mit.edu/static/assets/6e61fa7e48326bd2026d28e7a62884b1.svg";
    projectDelButton.appendChild(delImg);

    projectDelButton.addEventListener("click", (event) => {
      deleteProject(folderName, projectLink);
      event.target.parentNode.parentNode.remove();
    });
  }

  function deleteProject(folder, project) {
    let folders = JSON.parse(localStorage.getItem("Folders"));

    for (let i = 0; i < folders.Folders.length; i++) {
      if (folders.Folders[i].name === folder) {
        for (let j = 0; j < folders.Folders[i].projects.length; j++) {
          if (folders.Folders[i].projects[j] === project) {
            folders.Folders[i].projects.splice(j, 1);
          }
        }
      }
    }

    localStorage.setItem("Folders", JSON.stringify(folders));
  }

  function renameFolder(original, target) {
    let folders = JSON.parse(localStorage.getItem("Folders"));

    for (let i = 0; i < folders.Folders.length; i++) {
      if (folders.Folders[i].name === original) {
        folders.Folders[i].name = target;
        break;
      }
    }

    localStorage.setItem("Folders", JSON.stringify(folders));
  }
}
