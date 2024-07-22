import { pingifyTextNode } from "../../libraries/common/cs/fast-linkify.js";

export default async function ({ addon, console }) {
  const linkified = [];

  function pingify(element) {
    linkified.push({
      element,
      original: element.innerHTML,
    });
    return pingifyTextNode(element);
  }

  function linkifyAll() {
    document.querySelectorAll(".post_body_html, .postsignature").forEach((post) => {
      pingify(post);
      post.querySelectorAll("span, li, blockquote").forEach((el) => pingifyTextNode(el));
    });
  }

  addon.self.addEventListener("disabled", () => {
    for (const { element, original } of linkified) {
      element.innerHTML = original;
    }
  });

  addon.self.addEventListener("reenabled", () => {
    linkifyAll();
  });

  linkifyAll();
}
