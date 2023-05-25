export default async function ({ addon, console, msg }) {
  while (true) {
    const comment = await addon.tab.waitForElement("div.comment", {
      markAsSeen: true,
      reduxCondition: (state) => state.scratchGui.mode.isPlayerOnly,
    });
    if (comment.querySelector("form")) continue; // Comment input

    const commentAuthor = new URL(comment.querySelector(".comment-top-row .username").href).pathname.split("/")[2];
    const projectAuthor = addon.tab.redux.state.preview.projectInfo.author.username;

    if (commentAuthor === projectAuthor) {
      const opBadge = document.createElement("small");
      opBadge.innerText = msg("op");
      comment.querySelector(".comment-top-row").appendChild(opBadge);
    }
  }
}
