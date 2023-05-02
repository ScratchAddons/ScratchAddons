export default async function({ addon, console, msg }) {
    const comments = document.querySelectorAll(".comment");
    const op = document.querySelector(".project-header").querySelector("img").alt;

    for (const comment of comments) {
        if (op == comment.querySelector(".username").innerText) {
            let op_badge = document.createElement("small");

            op_badge.innerText = msg("op");

            comment.querySelector(".username").appendChild(op_badge);
        }
    }
}
