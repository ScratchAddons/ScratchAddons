export default async function ({ addon }) {
  const shareFunction = document.createElement("a");
  shareFunction.classList.add("media-share");
  shareFunction.dataset.control = "share";

  const shareButton = document.createElement("a");
  shareButton.classList.add("sa-share-button");
  shareButton.innerText = "Share";
  addon.tab.displayNoneWhileDisabled(shareButton, {
    display: "block",
  });
  async function shareConfirmation(event) {
    let confirmation = await addon.tab.confirm("Share this project?", "Are you sure you want to share this project?");
    if (confirmation) event.target.parentElement.querySelector(".media-share").click();
  }

  while (true) {
    const project = await addon.tab.waitForElement("div.media-item-content.not-shared", {
      markAsSeen: true,
    });
    let localShareFunction = shareFunction.cloneNode();
    let localShare = shareButton.cloneNode(true);
    localShareFunction.href = `${location.hash}`;
    localShare.href = localShareFunction.href;
    project.querySelector(".media-action div").appendChild(localShareFunction);
    localShare.addEventListener("click", shareConfirmation);
    project.querySelector(".media-action div").appendChild(localShare);
  }
}
