export default async function ({ addon, console, msg }) {
  const projectId = location.pathname.replace(/projects|\//g, "");
  const remixTreePage = await (await fetch(`https://scratch.mit.edu/projects/${projectId}/remixtree/`)).text();
  const parser = new DOMParser();
  const status = [...parser.parseFromString(remixTreePage, "text/html").querySelectorAll("script")]
    .find((el) => el.textContent.trim().startsWith("var projectData"))
    .textContent.match(/"moderation_status":"(.*?)"/)[1];

  const addStatus = async () => {
    if (addon.tab.editorMode !== "projectpage") {
      return;
    }
    const statusElement = document.createElement("span");
    statusElement.textContent = msg(status);
    statusElement.classList.add("sa-nfe-checker-status");
    statusElement.title = msg(`title-${status}`);
    const shareDate = await addon.tab.waitForElement(".share-date");
    shareDate.appendChild(document.createTextNode(" - "));
    shareDate.appendChild(statusElement);
  };

  addStatus();

  addon.tab.addEventListener("urlChange", addStatus);
}
