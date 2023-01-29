export default async function ({ addon, global }) {
  const shareFunction = document.createElement("a");
  shareFunction.classList.add("media-share");
  shareFunction.dataset.control = "share";
  shareFunction.href = "#";

  const shareButton = document.createElement("a");
  async function shareConfirmation(event) {
    let confirmation = await addon.tab.confirm("Share this project?", "Are you sure you want to share this project?");
    if (confirmation) event.target.parentElement.querySelector(".media-share").click();
  }
  shareButton.href = "#";
  shareButton.classList.add("sa-share-button");
  shareButton.innerText = "Share";
  addon.tab.displayNoneWhileDisabled(shareButton, {
    display: "block",
  });

  while (true) {
    const project = await addon.tab.waitForElement("div.media-item-content.not-shared", {
      markAsSeen: true,
    });
    project.querySelector(".media-action div").appendChild(shareFunction.cloneNode());
    let localShare = shareButton.cloneNode(true);
    localShare.addEventListener("click", shareConfirmation);
    project.querySelector(".media-action div").appendChild(localShare);
  }
}
