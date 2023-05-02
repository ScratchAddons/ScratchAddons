export default async function({ addon, console, msg }) {
    const posts = document.querySelectorAll(".blockpost");

    if ((new URLSearchParams(location.search).get("page")) || 1 == 1) {
        const html = document.querySelectorAll(".blockpost");
        var op = html[0].querySelector(".username").innerText;
    } else {
        const html = new DOMParser().parseFromString(await fetch(`https://scratch.mit.edu/discuss/topic/${window.location.href.split("/")[5]}/`).then(res => res.text()), "text/html");
        var op = html.querySelectorAll(".blockpost")[0].querySelector(".username").innerText;
    }

    for (const post of posts) {
        if (op == post.querySelectorAll(".username")[0].innerText) {
            let op_badge = document.createElement("div");

            op_badge.innerText = msg("op");

            post.querySelector(".postleft").querySelector("dl").appendChild(op_badge);
        }
    }
}
