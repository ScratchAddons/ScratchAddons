export default async function({ addon, console, msg }) {
    const posts = document.querySelectorAll(".blockpost");

    const op = await fetch(`https://scratchdb.lefty.one/v3/forum/topic/posts/${window.location.href.split("/")[5]}/0?o=oldest`).then(res => res.json());

    for (const i of posts) {
        if (i.querySelector(".username").innerText == op[0].username) {
            let op_badge = document.createElement("div");

            op_badge.innerText = msg("op");

            i.querySelector(".postleft").querySelector("dl").appendChild(op_badge);
        }
    }
}
