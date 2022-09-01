import formatProfileComments from "../../libraries/common/cs/format-profile-comments.js";

export default async function ({ addon, global, console }) {
  const cache = new Map();
  addon.self.addEventListener("disabled", () => {
    cache.forEach((content, comment) => {
      comment.innerHTML = "";
      comment.style.whiteSpace = "nowrap";

      for (const elm of content.childNodes) {
        const cloned = elm.cloneNode(true);
        comment.appendChild(cloned);
      }
    });
  });
  addon.self.addEventListener("reenabled", () => {
    cache.forEach((content, comment) => {
      comment.style.whiteSpace = "break-spaces";
      formatProfileComments(comment);
    });
  });
  while (true) {
    const comment = await addon.tab.waitForElement(".comment .content", { markAsSeen: true });
    cache.set(comment, comment.cloneNode(true));
    if (!addon.self.disabled) {
      comment.style.whiteSpace = "break-spaces";
      formatProfileComments(comment);
    }
  }
}
