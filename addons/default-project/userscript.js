export default async function ({ addon, global, console, msg }) {
  const loadProject = () => {
    const projectId = addon.settings.get("projectId");
    if (projectId !== 510186917) addon.tab.traps.vm.downloadProjectId(projectId);
  };

  const initialPathname = location.pathname;
  // For newly created projects (e.g. clicking create button)
  if (initialPathname === "/projects/editor/") addon.tab.addEventListener("urlChange", loadProject, { once: true });

  // File > New
  addon.tab.addEventListener("urlChange", (e) => {
    if (e.detail.newUrl === "https://scratch.mit.edu/projects/editor") {
      addon.tab.addEventListener("urlChange", loadProject, { once: true });
    }
  });
}
