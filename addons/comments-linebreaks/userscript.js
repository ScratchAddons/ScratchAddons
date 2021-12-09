import formatProfileComments from "../../libraries/common/cs/format-profile-comments.js";

export default async function ({ addon, global, console }) {
  while (true) {
    const comment = await addon.tab.waitForElement(".comment .content", { markAsSeen: true });
    comment.style.whiteSpace = "break-spaces";
    if (addon.settings.get("scrollbars")) {
	    comment.style.maxHeight = "100px";
	    comment.style.overflow = "auto";
	}
    formatProfileComments(comment);
  }
}
