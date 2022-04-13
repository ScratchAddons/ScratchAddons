export default async function ({ addon, msg }) {
  addon.self.addEventListener(
    "disabled",
    () => (document.querySelector(".sa-remaining-replies").style.display = "none")
  );
  addon.self.addEventListener(
    "reenabled",
    () => (document.querySelector(".sa-remaining-replies").style.display = "inline")
  );

  while (true) {
    // wait for input box
    const commentInput = await addon.tab.waitForElement("div.compose-row", {
      markAsSeen: true,
    });

    // skip the main comment input at the top of the page
    if (commentInput.parentElement.parentElement.classList.contains("studio-compose-container")) continue;

    let parentComment = commentInput.parentElement.parentElement.parentElement;
    if (parentComment.parentElement.classList.contains("replies")) {
      // the current "parentComment" is a reply to another comment
      parentComment = parentComment.parentElement.parentElement.children[0];
    }

    const parentCommentID = parentComment.getAttribute("id");
    const parentCommentData = addon.tab.redux.state.comments.comments.filter(
      // substring in order to remove the "comments-" prefix
      (comment) => comment.id == parentCommentID.substring(9)
    )[0];

    const remainingReplies = 25 - parentCommentData?.reply_count;
    const remainingRepliesDisplay = document.createElement("span");
    remainingRepliesDisplay.classList.add("sa-remaining-replies");
    remainingRepliesDisplay.style.fontWeight = "bold";
    remainingRepliesDisplay.innerText = `${remainingReplies} ${remainingReplies > 1 ? "replies" : "reply"}, `;
    commentInput
      .querySelector(".compose-limit")
      .insertBefore(remainingRepliesDisplay, commentInput.querySelector(".compose-limit > span"));
  }
}
