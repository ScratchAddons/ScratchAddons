export default async function ({ addon, msg }) {
  const submitButton = document.querySelector("#djangobbwrap .form-submit [type=submit]");

  submitButton.addEventListener("click", () => {
    if (!sessionStorage.getItem("sa-forum-post-countdown")) {
      sessionStorage.setItem("sa-forum-post-countdown", Date.now());
    }
  });

  const countdown = sessionStorage.getItem("sa-forum-post-countdown");
  if (!countdown) {
    return;
  }

  const loggedIn = await addon.auth.fetchIsLoggedIn();
  const secondCount = (
    await fetch("/session", { headers: { "x-requested-with": "XMLHttpRequest" } }).then((resp) => resp.json())
  ).permissions.new_scratcher
    ? 120
    : 60;

  const elt = document.createElement("div");
  elt.id = "sa-forum-post-countdown";
  document.body.appendChild(elt);

  setInterval(async () => {
    const now = Date.now();
    if (now > Number(countdown) + secondCount * 1000 || !loggedIn) {
      sessionStorage.removeItem("sa-forum-post-countdown");
      elt.remove();
      return;
    }
    elt.textContent = msg("seconds-left", { seconds: secondCount - Math.floor((now - countdown) / 1000) });
  }, 1000);

  addon.tab.displayNoneWhileDisabled(elt);
}
