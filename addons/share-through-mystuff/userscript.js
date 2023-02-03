export default async function ({ addon, console }) {
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
    event.preventDefault();
    let confirmation = await addon.tab.confirm("Share this project?", "Are you sure you want to share this project?");
    if (confirmation) {
      if (location.hash == "#unshared") {
        let container = event.target.parentElement.parentElement.parentElement.parentElement;
        container.classList.add("sa-justShared");
      }
      event.target.parentElement.querySelector(".media-share").click();
    }
  }

  while (true) {
    const project = await addon.tab.waitForElement("div.media-item-content.not-shared", {
      markAsSeen: true,
    });
    let localShareFunction = shareFunction.cloneNode();
    localShareFunction.href = location.hash || "#";
    project.querySelector(".media-action div").appendChild(localShareFunction);
    let localShare = shareButton.cloneNode(true);
    localShare.href = localShareFunction.href;
    localShare.addEventListener("click", shareConfirmation);
    project.querySelector(".media-action div").appendChild(localShare);
  }
}
