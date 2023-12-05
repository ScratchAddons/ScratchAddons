import downloadBlob from "../../libraries/common/cs/download-blob.js";

export default async function ({ addon, console }) {
  const vm = addon.tab.traps.vm;

  async function download() {
    const project = await vm.saveProjectSb3();
    const title = await addon.tab.waitForElement(".project-title");
    downloadBlob(`${title.innerHTML}.sb3`, project);
  }

  const downloadButton = document.createElement("button");
  downloadButton.innerHTML = "Download project";
  downloadButton.onclick = download;
  downloadButton.classList = "button sa-download-button";

  await addon.tab.waitForElement(".see-inside-button");

  addon.tab.appendToSharedSpace({
    space: "beforeRemixButton",
    element: downloadButton,
    order: 2,
  });
}
