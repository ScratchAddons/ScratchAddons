export default async function ({ addon, global, console, msg }) {
  // get signatures
  const posts = document.querySelectorAll(".blockpost");

  for (const post of posts) {
    const actionsWrapper = post.querySelector(".postfootright");
    const signature = post.querySelector(".postsignature");
    if (!signature) continue;

    const hideBtnWrapper = document.createElement("li");
    const hideBtn = document.createElement("a");

    hideBtn.href = "#hide";
    hideBtn.innerText = msg("hide");

    let show = !addon.settings.get("hide");
    signature.style.display = show ? "block" : "none";
    hideBtn.innerText = msg(show ? "hide" : "show");

    hideBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      show = !show;
      signature.style.display = show ? "block" : "none";
      hideBtn.innerText = msg(show ? "hide" : "show");
    });

    addon.self.addEventListener("disabled", () => {
      show = true;
      signature.style.display = "block";
      hideBtn.innerText = msg("hide");
    });

    hideBtnWrapper.appendChild(hideBtn);

    addon.tab.appendToSharedSpace({
      space: "forumsBeforePostReport",
      element: hideBtnWrapper,
      scope: actionsWrapper,
      order: 9,
    });
    addon.tab.displayNoneWhileDisabled(hideBtnWrapper);
  }
}
