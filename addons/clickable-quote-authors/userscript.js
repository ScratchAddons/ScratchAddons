export default async function ({ addon, console }) {
    const authors = document.getElementsByClassName("bb-quote-author");

    for (const author of authors) {
        const authorName = author.textContent.match(/.+(?= wrote:)/);

        const link = document.createElement("a");
        link.textContent = authorName;
        link.href = `https://scratch.mit.edu/users/${authorName}/`

        if (addon.settings.get("hidden"))
            link.style.color = "inherit";

        author.textContent = " wrote:";
        author.prepend(link);
    };
}