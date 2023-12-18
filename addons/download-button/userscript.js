import downloadBlob from "../../libraries/common/cs/download-blob.js";

export default async function ({ addon, console }) {
  window.addon = addon;
  const vm = addon.tab.traps.vm;
  const { redux } = addon.tab;

  await redux.waitForState((state) => typeof state.session.session?.user === "object");
  const username = await addon.auth.fetchUsername();

  await redux.waitForState((state) => state.preview.status.project === "FETCHED");
  const projectAuthor = redux.state.preview.projectInfo.author?.username;

  const isOwn = username === projectAuthor;
  const shared = (await addon.tab.redux.state.preview.projectInfo.is_published) == true ? true : false;

  async function download() {
    const project = await vm.saveProjectSb3();
    const title = isOwn
      ? await addon.tab.waitForElement(".project-title input")
      : await addon.tab.waitForElement(".project-title");
    downloadBlob(`${isOwn ? title.value : title.innerText}.sb3`, project);
  }

  const downloadButton = document.createElement("button");
  downloadButton.innerText = "Download";
  downloadButton.onclick = download;
  downloadButton.classList = "button action-button sa-download-button";

  function addbutton() {
    addon.tab.waitForElement(".flex-row .subactions", { markAsSeen: true });
    addon.tab.appendToSharedSpace({
      space: shared ? "afterCopyLinkButton" : "beforeProjectActionButtons",
      element: downloadButton,
      order: shared ? -1 : 1,
    });
  }

  addbutton();
  addon.tab.addEventListener("urlChange", () => {
    addbutton();
  });

  addon.tab.displayNoneWhileDisabled(downloadButton);
}
