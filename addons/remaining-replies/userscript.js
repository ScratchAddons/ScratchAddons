export default async function ({ addon, msg }) {
  // function addRemainingReplyCount(comment) {

  // }

  while (true) {
    // wait for input box
    const comment = await addon.tab.waitForElement("div.comment", {
      markAsSeen: true,
    });

    // skip the main comment input at the top of the page
    if (comment.classList.contains("compose-row")) continue;
    // comments are off on the page
    if (!comment.querySelector(".comment-reply span")) continue;

    let parentComment = comment.parentElement.classList.contains("replies")
      ? comment.parentElement.parentElement.children[0]
      : comment;

    // if (comment.parentElement.classList.contains("replies")) {
    //   // the current comment is a reply to another comment
    //   parentComment = comment.parentElement.parentElement.children[0];
    // } else {
    //   parentComment = comment;
    // }

    const parentCommentID = parentComment.getAttribute("id");
    const parentCommentData = addon.tab.redux.state.comments.comments.filter(
      // substring in order to remove the "comments-" prefix
      (comment_in_list) => comment_in_list.id == parentCommentID.substring(9)
    )[0];

    const remainingReplies = 25 - parentCommentData?.reply_count;
    comment.querySelector(".comment-reply span").innerText += ` (${remainingReplies} left)`;
  }
}
