import downloadBlob from "../../libraries/common/cs/download-blob.js";

export default async function ({ addon, console }) {
  const vm = addon.tab.traps.vm;

  async function download() {
    const project = await vm.saveProjectSb3();
    const title = await addon.tab.waitForElement(".project-title");
    downloadBlob(`${title.innerText}.sb3`, project);
  }

  const downloadButton = document.createElement("button");
  downloadButton.innerText = "Download";
  downloadButton.onclick = download;
  downloadButton.classList = "button sa-download-button";

  const seeInsideButton = await addon.tab.waitForElement(".see-inside-button");
  const container = document.querySelector(".project-buttons");
  container.insertBefore(downloadButton, seeInsideButton);
}
