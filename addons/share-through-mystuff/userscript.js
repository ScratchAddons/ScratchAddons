export default async function ({ addon, global }) {
  const shareFunction = document.createElement("a");
  shareFunction.classList.add("media-share");
  shareFunction.dataset.control = "share";
  shareFunction.href = "#";

  const shareButton = document.createElement("a");
  function shareConfirmation(event) {
    let confirmation = confirm("Would you like to share this project?");
    if (confirmation) event.target.parentElement.querySelector(".media-share").click();
  }
  shareButton.href = "#";
  shareButton.classList.add("sa-share-button");
  shareButton.innerText = "Share";

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
