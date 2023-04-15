export default async function({ addon, console }) {
    const posts = document.querySelectorAll(".blockpost");

    const op = await fetch(`https://scratchdb.lefty.one/v3/forum/topic/posts/${window.location.href.split("/")[5]}/0?o=oldest`).then(res => res.json());

    for (const i of posts) {
        if (i.querySelector(".username").innerText == op[0].username) {
            let br = document.createElement("br");
            let op_badge = document.createElement("span");

            op_badge.innerText = "OP";

            i.querySelector(".postleft").querySelector("dl").appendChild(br);
            i.querySelector(".postleft").querySelector("dl").appendChild(op_badge);
        }
    }
}
