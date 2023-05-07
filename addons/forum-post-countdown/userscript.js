export default async function ({ addon, msg }) {
  const countdown = localStorage.getItem("sa-forum-post-countdown");
  if (!countdown) {
    return;
  }

  let secondCount = addon.settings.get("120-second") ? 120 : 60;

  const elt = document.createElement("div");
  elt.id = "sa-forum-post-countdown";
  document.body.appendChild(elt);

  setInterval(async () => {
    const now = Date.now();
    if (now > Number(countdown) + secondCount * 1000 || !(await addon.auth.fetchIsLoggedIn())) {
      localStorage.removeItem("sa-forum-post-countdown");
      elt.remove();
      return;
    }
    elt.textContent = msg("seconds-left", { seconds: secondCount - Math.floor((now - countdown) / 1000) });
  });

  addon.settings.addEventListener("change", () => {
    secondCount = addon.settings.get("120-second") ? 120 : 60;
  });

  addon.self.addEventListener("disabled", () => {
    elt.style.display = "none";
  });
  addon.self.addEventListener("reenabled", () => {
    elt.style.display = "";
  });
}
