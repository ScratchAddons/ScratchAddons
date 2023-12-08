export default async function ({ addon, msg }) {
  function addRemainingReplyCount(comment) {
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

    if (addon.settings.get("show_only_if_less_than_10") && remainingReplies > 10) return;

    comment.querySelector(".comment-reply span").innerText = `${msg("reply")} (${remainingReplies} ${msg(
      "remaining"
    )})`;
  }

  async function waitForComment() {
    while (true) {
      // wait for input box
      const comment = await addon.tab.waitForElement("div.comment", {
        markAsSeen: true,
      });

      addRemainingReplyCount(comment);
    }
  }

  waitForComment();

  addon.tab.redux.initialize();
  addon.tab.redux.addEventListener("statechanged", (action, prev, next) => {
    if (action.detail.action.type === "ADD_NEW_COMMENT") {
      console.log("parent id", action.detail.action.comment.parent_id);
      const comment = document.getElementById(`comments-${action.detail.action.comment.parent_id}`);
      addRemainingReplyCount(comment);

      addon.tab.redux.state.comments.replies[action.detail.action.comment.parent_id].forEach((reply) => {
        addRemainingReplyCount(document.getElementById(`comments-${reply.id}`));
      });
    }
  });
}
