export default async function ({ addon, console, msg }) {
  Scratch.MyStuff.ProjectThumbnailCollectionView.prototype.shared = function (project) {
    // Scratch's implementation incorrectly calls fadeOut on the entire list
    if (this.model.options.collectionType === "notshared") {
      project.$el.fadeOut();
    }
  };

  const shareFunction = document.createElement("a");
  shareFunction.classList.add("media-share");
  shareFunction.dataset.control = "share";

  const shareButton = document.createElement("a");
  shareButton.classList.add("sa-share-button");
  shareButton.innerText = msg("share");
  addon.tab.displayNoneWhileDisabled(shareButton, {
    display: "block",
  });
  async function shareConfirmation(event) {
    event.preventDefault();
    const confirmation = await addon.tab.confirm(msg("confirmation-title"), msg("confirmation"));
    if (confirmation) {
      event.target.parentElement.querySelector(".media-share").click();
    }
  }

  while (true) {
    const project = await addon.tab.waitForElement("div.media-item-content.not-shared", {
      markAsSeen: true,
    });
    const localShareFunction = shareFunction.cloneNode();
    localShareFunction.href = location.hash || "#";
    project.querySelector(".media-action div").appendChild(localShareFunction);
    const localShare = shareButton.cloneNode(true);
    localShare.href = localShareFunction.href;
    localShare.addEventListener("click", shareConfirmation);
    project.querySelector(".media-action div").appendChild(localShare);
  }
}
