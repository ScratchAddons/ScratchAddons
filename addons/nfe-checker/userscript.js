export default async function ({ addon, console, msg }) {
  const projectId = location.pathname.replace(/projects|\//g, "");
  const apiResponse = await (await fetch(`https://scratch.mit.edu/projects/${projectId}/remixtree/bare/`)).text();
  let status = "";
  if (apiResponse === "no data") {
    status = "unavailable";
  } else {
    const parsedResponse = JSON.parse(apiResponse);
    const moderationStatus = parsedResponse[Number(projectId)].moderation_status;
    status = moderationStatus === "safe" ? "fe" : moderationStatus === "notsafe" ? "nfe" : "unreviewed";
  }

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
