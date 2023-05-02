export default async function({ addon, console, msg }) {
    const comments = document.querySelectorAll(".comments-list")
    const replies = document.querySelector(".comments-list")
        .querySelector(".comment-container")
        .querySelector(".comment")
        .querySelectorAll(".replies")
    const op = document.querySelector(".project-header")
        .querySelector("img")
        .alt;

    for (const comment of comments) {
        if (op == comment.querySelector(".comment-container")
            .querySelector(".comment")
            .querySelector(".comment-body")
            .querySelector(".comment-top-row")
            .querySelector(".username")
            .innerText
        ) {
            let op_badge = document.createElement("small");

            op_badge.innerText = msg("op");

            comment.querySelector(".comment-container")
                .querySelector(".comment")
                .querySelector(".comment-body")
                .querySelector(".comment-top-row")
                .appendChild(op_badge);
        }
    }

    for (const reply of replies) {
        if (op == reply.querySelector(".comment")
            .querySelector(".comment-body")
            .querySelector(".comment-top-row")
            .querySelector(".username")
            .innerText
        ) {
            let op_badge = document.createElement("small");

            op_badge.innerText = msg("op");

            reply.querySelector(".comment")
                .querySelector(".comment-body")
                .querySelector(".comment-top-row")
                .appendChild(op_badge);
        }
    }
}
