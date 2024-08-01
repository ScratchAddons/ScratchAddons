import { pingifyTextNode } from "../../libraries/common/cs/fast-linkify.js";

export default async function ({ addon, console }) {
  const authors = document.getElementsByClassName("bb-quote-author");
  const linkified = [];

  function pingify(element) {
    linkified.push({ element, original: element.innerHTML });
    pingifyTextNode(element);
  }

  function linkifyAll() {
    linkified.length = 0;
    document.querySelectorAll(".post_body_html, .postsignature").forEach((post) => {
      pingify(post);
      post.querySelectorAll("span, li, blockquote").forEach(pingifyTextNode);
    });

    for (const author of authors) {
      const authorName = author.textContent.match(/(?<=^)[\w-]{2,30}(?= wrote:$)/);

      if (!authorName) continue;

      const link = document.createElement("a");
      link.textContent = authorName;
      link.href = `https://scratch.mit.edu/users/${authorName}/`;

      author.textContent = " wrote:";
      author.prepend(link);
    }
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
