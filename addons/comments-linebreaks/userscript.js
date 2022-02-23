import formatProfileComments from "../../libraries/common/cs/format-profile-comments.js";

export default async function (/** @type {typeof UserscriptUtils} */ { addon, global, console }) {
  while (true) {
    const comment = await addon.tab.waitForElement(".comment .content", { markAsSeen: true });
    comment.style.whiteSpace = "break-spaces";
    formatProfileComments(comment);
  }
}
