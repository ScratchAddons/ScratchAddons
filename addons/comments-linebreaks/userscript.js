import formatProfileComments from "../../libraries/common/cs/format-profile-comments.js";

export default async function ({ addon, global, console }) {
  const cache = Object.create(null);
  addon.self.addEventListener("disabled", () => {
    for (const comment of Object.keys(cache)) {
      const cached = cache[comment];
      cached.comment.innerHTML = "";
      cached.comment.style.whiteSpace = "nowrap";

      for (const elm of cached.content.childNodes) {
        const cloned = elm.cloneNode();
        cached.comment.appendChild(cloned);
      }
    }
  });
  addon.self.addEventListener("reenabled", () => {
    for (const comment of Object.keys(cache)) {
      cache[comment].comment.style.whiteSpace = "break-spaces";
      formatProfileComments(cache[comment].comment);
    }
  });
  while (true) {
    const comment = await addon.tab.waitForElement(".comment .content", { markAsSeen: true });
    cache[comment.parentElement.parentElement.id] = { comment, content: comment.cloneNode(true) };
    if (!addon.self.disabled) {
      comment.style.whiteSpace = "break-spaces";
      formatProfileComments(comment);
    }
  }
}
