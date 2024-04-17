export default async function ({ addon, console }) {
    const authors = document.getElementsByClassName("bb-quote-author");
    console.log(authors.length);

    for (const author of authors) {
        const authorName = author.textContent.match(/.+(?= wrote:)/);
        
        const link = document.createElement("a");
        link.textContent = authorName;
        link.href = `https://scratch.mit.edu/users/${authorName}/`
        
        author.textContent = " wrote:";
        author.prepend(link);
    };
}