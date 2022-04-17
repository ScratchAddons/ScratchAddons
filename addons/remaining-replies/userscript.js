export default async function ({ addon, msg }) {
  function addRemainingReplyCount(comment) {
    // skip the main comment input at the top of the page
    if (comment.classList.contains("compose-row")) return;
    // comments are off on the page
    if (!comment.querySelector(".comment-reply span")) return;

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
    comment.querySelector(".comment-reply span").innerText = `reply (${remainingReplies} left)`;
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

  // async function refreshRemainingReplyCount() {
  //   document.querySelectorAll(".comment").forEach((comment) => {
  //     addRemainingReplyCount(comment);
  //   });
  // }

  // async function waitForPostButton() {
  //   while (true) {
  //     // wait for post button
  //     const postButton = await addon.tab.waitForElement("button.compose-post", { markAsSeen: true });

  //     postButton.addEventListener("click", async () => {
  //       console.log("post button clicked");
  //       const newComment = await addon.tab.waitForElement(".comment-reply", {
  //         markAsSeen: true,
  //       });

  //       // alert("whoa there, you created a new comment!");
  //     });
  //   }
  // }

  waitForComment();
  // waitForPostButton();

  addon.tab.redux.initialize();
  addon.tab.redux.addEventListener("statechanged", (action, prev, next) => {
    if (action.detail.action.type === "ADD_NEW_COMMENT") {
      console.log("parent id", action.detail.action.comment.parent_id);
      const comment = document.getElementById(`comments-${action.detail.action.comment.parent_id}`);
      addRemainingReplyCount(comment);

      // parent comment
      addon.tab.redux.state.comments.replies[action.detail.action.comment.parent_id].forEach((reply) => {
        addRemainingReplyCount(document.getElementById(`comments-${reply.id}`));
      });
    }
  });
}
