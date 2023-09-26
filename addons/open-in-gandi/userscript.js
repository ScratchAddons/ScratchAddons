export default async function ({ addon, console, msg }) {
  const button = document.createElement("button");
  button.className = "button sa-gd-button";
  button.title = msg("open");

  button.onclick = async (e) => {
    const projectId = window.location.pathname.split("/")[2];
    window.location.href = `https://cocrea.world/projects/${projectId}/`;
  };

  await addon.tab.waitForElement("div.project-buttons");

  addon.tab.appendToSharedSpace({ space: "beforeRemixButton", element: button, order: 2 });
}
