export default async function ({ addon, msg }) {
  function addRemainingReplyCount(comment) {
    if (!comment) return;
    // skip the main comment input at the top of the page
    if (comment.classList.contains("compose-row")) return;
    // commenting was turned off for the studio
    if (!comment.querySelector(".comment-reply span")) return;

    let parentComment = comment.parentElement.classList.contains("replies")
      ? comment.parentElement.parentElement.children[0]
      : comment;

    const parentCommentID = parentComment.getAttribute("id");
    const parentCommentData = addon.tab.redux.state.comments.comments.filter(
      // substring in order to remove the "comments-" prefix
      (comment_in_list) => comment_in_list.id == parentCommentID.substring(9)
    )[0];

    const remainingReplies = 25 - parentCommentData?.reply_count;

    let span = comment?.querySelector(".sa-replies-remaining");
    if (!span) {
      span = document.createElement("span");
      span.classList.add("sa-replies-remaining");
      comment.querySelector(".comment-reply span").appendChild(span);
      addon.tab.displayNoneWhileDisabled(span);
    }

    if (remainingReplies > 10) span.classList.add("sa-replies-remaining-hide");
    else span.classList.remove("sa-replies-remaining-hide");
    span.innerText = " " + msg("remaining", { replies: remainingReplies });
  }

  const comments = [];

  async function waitForComment() {
    while (true) {
      // wait for input box
      const comment = await addon.tab.waitForElement("div.comment", {
        markAsSeen: true,
      });

      comments.push(comment);
      addRemainingReplyCount(comment);
    }
  }

  waitForComment();

  addon.tab.redux.initialize();
  addon.tab.redux.addEventListener("statechanged", (action, prev, next) => {
    if (action.detail.action.type === "ADD_NEW_COMMENT") {
      const comment = document.getElementById(`comments-${action.detail.action.comment.parent_id}`);
      addRemainingReplyCount(comment);

      const replies = addon.tab.redux.state.comments.replies[action.detail.action.comment.parent_id];
      if (!replies) return;

      replies.forEach((reply) => {
        addRemainingReplyCount(document.getElementById(`comments-${reply.id}`));
      });
    }

    // Re-add when allow commenting is toggled
    if (action.detail.action.type === "COMPLETE_STUDIO_MUTATION") {
      comments.forEach((comment) => {
        addRemainingReplyCount(comment);
      });
    }
  });
}
