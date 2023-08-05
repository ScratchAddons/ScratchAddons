export default async function ({ addon, msg }) {
  const submitButton = document.querySelector("#djangobbwrap .form-submit [type=submit]");

  submitButton.addEventListener("click", () => {
    if (!localStorage.getItem("sa-forum-post-countdown")) {
      localStorage.setItem("sa-forum-post-countdown", Date.now());
    }
  });

  const countdown = localStorage.getItem("sa-forum-post-countdown");
  if (!countdown) {
    return;
  }

  const loggedIn = await addon.auth.fetchIsLoggedIn();
  if (!loggedIn) {
    localStorage.removeItem("sa-forum-post-countdown");
    return;
  }
  const secondCount = (
    await fetch("/session", { headers: { "x-requested-with": "XMLHttpRequest" } }).then((resp) => resp.json())
  ).permissions.new_scratcher
    ? 120
    : 60;

  const elt = document.createElement("span");
  elt.id = "sa-forum-post-countdown";
  submitButton.insertAdjacentElement("beforeend", elt);
  submitButton.title = msg("cant-post");
  submitButton.classList.add("sa-forum-post-countdown-disabled");

  setInterval(async () => {
    const now = Date.now();
    if (now > Number(countdown) + secondCount * 1000) {
      localStorage.removeItem("sa-forum-post-countdown");
      submitButton.title = "";
      submitButton.classList.remove("sa-forum-post-countdown-disabled");
      elt.remove();
      return;
    }
    elt.textContent = msg("seconds-left", { seconds: secondCount - Math.floor((now - countdown) / 1000) });
  }, 1000);

  addon.tab.displayNoneWhileDisabled(elt);
}
