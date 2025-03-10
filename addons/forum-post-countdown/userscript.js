export default async function ({ addon, msg }) {
  const submitButton = document.querySelector("#djangobbwrap .form-submit [type=submit]");

  let message=document.querySelector(".success");

if (message) {
      localStorage.setItem("sa-forum-post-countdown", Date.now());
    }
  
  const countdown = localStorage.getItem("sa-forum-post-countdown");
  if (!countdown) {
    return;
  }

  const loggedIn = await addon.auth.fetchIsLoggedIn();
  if (!loggedIn) {
    localStorage.removeItem("sa-forum-post-countdown");
    return;
  }
  const secondCount = scratchAddons.session.permissions.new_scratcher ? 120 : 60;

  const elt = document.createElement("span");
  elt.id = "sa-forum-post-countdown";
  submitButton.insertAdjacentElement("beforeend", elt);
  submitButton.title = msg("cant-post");
  submitButton.classList.add("sa-forum-post-countdown-disabled");

  const checkbox = document.createElement("input");
  checkbox.type="checkbox";
  checkbox.id="sa-post-cooldown-checkbox";
  const label=document.createElement("label");
  label.for=checkbox.id;
  label.innerText="Post when ready";
  label.style.display="inline";
  let form_submit=document.querySelector("#djangobbwrap .form-submit");
  form_submit.appendChild(checkbox);
  form_submit.appendChild(label);

  setInterval(async () => {
    const now = Date.now();
    if (now > Number(countdown) + secondCount * 1000) {
      localStorage.removeItem("sa-forum-post-countdown");
      submitButton.title = "";
      submitButton.classList.remove("sa-forum-post-countdown-disabled");
      elt.remove();
      if (checkbox.checked) {
        submitButton.click();
      }
      checkbox.remove();
      label.remove();
      return;
    }
    elt.textContent = msg("seconds-left", { seconds: secondCount - Math.floor((now - countdown) / 1000) });
  }, 1000);

  addon.tab.displayNoneWhileDisabled(elt);
}
