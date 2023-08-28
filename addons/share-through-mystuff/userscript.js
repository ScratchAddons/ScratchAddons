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
      const xToken = await addon.auth.fetchXToken();
      const projectId = event.target
        .closest(".media-item-content")
        .querySelector(".media-thumb > a")
        .href.match(/\d+/)[0];

      const xhrOpen = XMLHttpRequest.prototype.open;
      XMLHttpRequest.prototype.open = function (method, path, ...args) {
        const newPath = `https://api.scratch.mit.edu/proxy/projects/${projectId}/share`;
        xhrOpen.call(this, "PUT", newPath, ...args);
        // CSRF token header is added by Scratch
        this.setRequestHeader("x-token", xToken);
        this.withCredentials = true;
        this.send = () => {
          this.setRequestHeader("X-Requested-With", ""); // Do not send this header
          XMLHttpRequest.prototype.send.call(this); // Send empty body
        };
        return undefined;
      };

      event.target.parentElement.querySelector(".media-share").click(); // .click() is synchronous
      // By this point, the request has already been sent. Remove traps.
      XMLHttpRequest.prototype.open = xhrOpen;
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
