import formatProfileComments from "../../libraries/common/cs/format-profile-comments.js";

export default async function ({ addon, console }) {
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
      fixComment(comment);
    });
  });
  addon.settings.addEventListener("change", () => {
    cache.forEach((content, comment) => {
      fixComment(comment);
    });
  });

  function fixComment(c) {
    if (!addon.self.disabled) {
      if (addon.settings.get("scrollbars")) {
        let height = addon.settings.get("height") * 20 + "px";
        c.style.maxHeight = height;
        c.style.overflow = "auto";
      } else {
        c.style.maxHeight = "none";
      }
      c.style.whiteSpace = "break-spaces";
      formatProfileComments(c);
    }
  }

  while (true) {
    const comment = await addon.tab.waitForElement(".comment .content", { markAsSeen: true });
    cache.set(comment, comment.cloneNode(true));
    fixComment(comment);
  }
}
