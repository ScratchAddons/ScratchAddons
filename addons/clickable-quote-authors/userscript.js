export default async function ({ addon, console }) {
  const authors = document.getElementsByClassName("bb-quote-author");

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
