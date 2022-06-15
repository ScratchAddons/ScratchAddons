export default async function (
  /** @type {import("../../addon-api/content-script/typedef.js").UserscriptUtilities} */ { addon, global, console, msg }
) {
  const posts = document.querySelectorAll(".blockpost");

  for (const post of posts) {
    const postContent = post.querySelector(".post_body_html");

    indexPost(postContent);
  }

  /**
   * @param {Element} quote
   * @param {?number} currentIndex
   */
  function indexPost(quote, currentIndex = 0) {
    let nextIndex = currentIndex + 1;

    for (const blockquote of [...quote.children].filter((e) => e.tagName === "BLOCKQUOTE")) {
      if (nextIndex >= addon.settings.get("pc")) {
        // containerify blockquote
        const clonedBlockquote = document.createElement("div");
        clonedBlockquote.innerHTML = blockquote.innerHTML;

        const clonedSender = [...blockquote.children]
          .find((e) => e.classList.contains("bb-quote-author"))
          .cloneNode(true);
        [...clonedBlockquote.childNodes].find((e) => e.classList.contains("bb-quote-author")).remove();

        // Clear blockquote
        blockquote.innerHTML = "";

        blockquote.appendChild(clonedSender);
        blockquote.appendChild(clonedBlockquote);

        clonedBlockquote.style.display = "none";

        let expanded = false;
        const wrote = blockquote.querySelector(".bb-quote-author");

        const btn = document.createElement("a");
        btn.href = "#expand";
        btn.className = "sa-quote-expand";
        btn.innerText = msg("expand");

        wrote.innerText += " ";
        wrote.appendChild(btn);

        btn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          expanded = !expanded;

          btn.innerText = expanded ? msg("collapse") : msg("expand");
          clonedBlockquote.style.display = expanded ? "block" : "none";
        });
      } else {
        indexPost(blockquote, nextIndex);
      }
    }
  }
}
