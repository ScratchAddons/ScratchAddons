function viewSource(post, msg) {
  return function (event) {
    event.preventDefault();
    const body = post.querySelector(".postmsg");
    if (event.target.getAttribute("data-state") === "post") {
      event.target.innerText = msg("source-button-active");
      event.target.removeAttribute("title");
      if (event.target.originalHTML === undefined) {
        event.target.originalHTML = body.firstElementChild;
      }
      body.removeChild(body.firstElementChild);
      const source = document.createElement("div");
      body.insertBefore(source, body.firstElementChild);
      source.className = "post_body_html";
      source.dataset.showBbcode = "";
      if (event.target.sourceText !== undefined) {
        event.target.setAttribute("data-state", "source");
        source.innerText = event.target.sourceText;
        return;
      }
      event.target.setAttribute("data-state", "loading");
      source.innerText = msg("loading");
      fetch("https://scratch.mit.edu/discuss/post/" + post.id.substring(1) + "/source/").then(function (res) {
        res.text().then(function (text) {
          event.target.setAttribute("data-state", "source");
          source.innerText = event.target.sourceText = text;
        });
      });
    } else if (event.target.getAttribute("data-state") === "source") {
      event.target.innerText = msg("source-button");
      event.target.title = msg("source-button-tooltip");
      event.target.setAttribute("data-state", "post");
      body.removeChild(body.firstElementChild);
      body.insertBefore(event.target.originalHTML, body.firstElementChild);
    }
  };
}

export default async function ({ addon, console, msg }) {
  while (true) {
    const post = await addon.tab.waitForElement(".blockpost", { markAsSeen: true });
    const sourceItem = document.createElement("li");
    addon.tab.displayNoneWhileDisabled(sourceItem);
    addon.tab.appendToSharedSpace({ space: "forumsAfterPostReport", scope: post, element: sourceItem, order: 0 });
    const sourceButton = document.createElement("a");
    sourceItem.appendChild(sourceButton);
    sourceItem.appendChild(document.createTextNode(" "));
    sourceButton.href = "#";
    sourceButton.innerText = msg("source-button");
    sourceButton.title = msg("source-button-tooltip");
    sourceButton.setAttribute("data-state", "post");
    sourceButton.addEventListener("click", viewSource(post, msg));
  }
}
