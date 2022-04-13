export default async function ({ addon, global, console, msg }) {
  // console.log(addon.tab.redux.state);
  while (true) {
    const commentInput = await addon.tab.waitForElement("div.compose-row", {
      markAsSeen: true,
    });

    // skip the main comment input at the top of the page
    if (commentInput.parentElement.parentElement.classList.contains("studio-compose-container")) continue;

    let parentComment = commentInput.parentElement.parentElement.parentElement;
    if (parentComment.parentElement.classList.contains("replies")) {
      // alert("you clicked nested reply");
      parentComment = parentComment.parentElement.parentElement.children[0];
    }
    // console.log(parentComment);

    const parentCommentID = parentComment.getAttribute("id");

    const parentCommentData = addon.tab.redux.state?.comments.comments.filter(
      (comment) => comment.id == parentCommentID.substring(9)
    )[0];

    const remainingReplies = 25 - parentCommentData?.reply_count;
    // const textNode = document.createTextNode(`${remainingReplies} ${remainingReplies > 1 ? "replies" : "reply"} left`);
    // commentInput.appendChild(textNode);

    // console.log(commentInput);

    const remainingRepliesDisplay = document.createElement("span");
    remainingRepliesDisplay.classList.add("sa-remaining-replies");
    remainingRepliesDisplay.style.fontWeight = "bold";
    remainingRepliesDisplay.innerText = `${remainingReplies} ${remainingReplies > 1 ? "replies" : "reply"}, `;
    commentInput
      .querySelector(".compose-limit")
      .insertBefore(remainingRepliesDisplay, commentInput.querySelector(".compose-limit > span"));
  }
}
