export default async function ({ addon, console, msg }) {
  const posts = document.querySelectorAll(".blockpost");
  let opUsername;

  if ((new URLSearchParams(location.search).get("page") || "1") === "1") {
    opUsername = posts[0].querySelector(".username").innerText;
  } else {
    const firstPageDocument = new DOMParser().parseFromString(
      await fetch(location.pathname).then((res) => res.text()),
      "text/html"
    );
    opUsername = firstPageDocument.querySelectorAll(".blockpost")[0].querySelector(".username").innerText;
  }

  for (const post of posts) {
    if (opUsername === post.querySelector(".username").innerText) {
      let opBadge = document.createElement("div");
      opBadge.classList.add("sa-original-poster");
      opBadge.innerText = msg("op");
      post.querySelector(".postleft dl").appendChild(document.createElement("br"));
      post.querySelector(".postleft dl").appendChild(opBadge);
    }
  }
}
