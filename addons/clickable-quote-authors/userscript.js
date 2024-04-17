export default async function ({ addon, console }) {
    const authors = document.getElementsByClassName("bb-quote-author");
    console.log(authors.length);

    for (let author of authors) {
        const authorName = author.innerText.match(/.+(?= wrote:)/);
        author.innerHTML = `<a href = "https://scratch.mit.edu/users/${authorName}/">${authorName}</a> wrote:`;
    };
}