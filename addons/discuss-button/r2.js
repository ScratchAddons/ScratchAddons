export default async function ({ addon }) {
  if (addon.tab.clientVersion === "scratch-www") return;
  let span;

  const add = async () => {
    if (!span && (await addon.auth.fetchIsLoggedIn())) {
      const username = await addon.auth.fetchUsername();
      (await addon.tab.waitForElement(".user-icon")).classList.add("sa-compact-profile-icon");
      const profileSpans = await addon.tab.waitForElement(".dropdown-menu .user-nav > :first-child > :first-child");
      span = profileSpans.appendChild(document.createElement("span"));
      span.className = "sa-profile-name";
      span.textContent = username;
    }
  };
  const remove = async () => {
    span?.remove();
    span = null;
    const icon = document.querySelector(".user-icon");
    if (icon) {
      icon.classList.remove("sa-compact-profile-icon");
    }
  };

  if (addon.settings.get("compact-nav")) add();
  addon.settings.addEventListener("change", () => {
    if (addon.settings.get("compact-nav")) {
      add();
    } else {
      remove();
    }
  });
  addon.self.addEventListener("disabled", () => remove());
  addon.self.addEventListener("reenabled", () => {
    if (addon.settings.get("compact-nav")) {
      add();
    } else {
      remove();
    }
  });
}
