(function () {
  'use strict';

  function insertPostCount() {
    const stats = document.querySelector(".stats");
    const username = document.querySelector("h2.username");

    if (!stats || !username) return;

    const postsLi = Array.from(stats.querySelectorAll("li")).find(li =>
      li.textContent.toLowerCase().includes("posts")
    );

    if (!postsLi) return;

    if (document.querySelector("#addon-post-count")) return; // evitar duplicados

    const info = document.createElement("div");
    info.id = "addon-post-count";
    info.textContent = postsLi.textContent.trim();
    info.style.fontSize = "14px";
    info.style.marginTop = "4px";
    info.style.color = "#666";

    username.parentElement.insertBefore(info, username.nextSibling);
  }

  window.addEventListener("load", () => {
    const interval = setInterval(insertPostCount, 300);
    setTimeout(() => clearInterval(interval), 5000);
  });
})();
