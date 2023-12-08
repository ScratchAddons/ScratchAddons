import downloadBlob from "../../libraries/common/cs/download-blob.js";

export default async function ({ addon, console }) {
  const vm = addon.tab.traps.vm;
  const { redux } = addon.tab;

  await redux.waitForState((state) => typeof state.session.session?.user === "object");
  const username = await addon.auth.fetchUsername();

  const projectAuthor =
    (await redux.state.preview.status.project) === "FETCHED"
      ? redux.state.preview.projectInfo.author?.username
      : "Can not find project author";

  const isOwn = username === projectAuthor;

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
  downloadButton.classList = "button sa-download-button";

  while (true) {
    const seeInsideButton = await addon.tab.waitForElement(".see-inside-button", {
      markAsSeen: true,
    });
    const container = document.querySelector(".project-buttons");
    container.insertBefore(downloadButton, seeInsideButton);
  }
}
