export default async function ({ addon, console }) {
  const authors = document.getElementsByClassName("bb-quote-author");
  addLinks();

  function addLinks() {
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
    for (const author of authors) {
      const authorLink = author.children[0];

      if (!authorLink) continue;

      author.textContent = `${authorLink.textContent} wrote:`;
    }
  });

  addon.self.addEventListener("reenabled", addLinks);
}
