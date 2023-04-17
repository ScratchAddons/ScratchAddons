export default async function({ addon, console, msg }) {
    const posts = document.querySelectorAll(".blockpost");

    if (window.location.href.split("?").join("").split("&")[0] == "page=1" || window.location.href.split("?").join("").split("&").length == 0) {
        const html = document.querySelectorAll(".blockpost");
        const op = html[0].querySelector(".username").innerText;
    } else {
        const html = new DOMParser().parseFromString(await fetch(`https://scratch.mit.edu/discuss/topic/${window.location.href.split("/")[5]}/`).then(res => res.text()), "text/html");
        const op = html.querySelectorAll(".blockpost")[0].querySelector(".username").innerText;
    }

    for (const i of posts) {
        if (op == i.querySelectorAll(".username")[0].innerText) {
            let op_badge = document.createElement("div");

            op_badge.innerText = msg("op");

            i.querySelector(".postleft").querySelector("dl").appendChild(op_badge);
        }
    }
}
