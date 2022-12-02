export default async function ({ addon }) {
  if (addon.tab.clientVersion === "scratch-www") return;
  let span;

  const add = async () => {
    if (!span && (await addon.auth.fetchIsLoggedIn())) {
      const username = await addon.auth.fetchUsername();
      const container = await addon.tab.waitForElement(".dropdown");
      const dropdown = await addon.tab.waitForElement(".dropdown-menu .user-nav");
      const profileSpans = dropdown.childNodes[0].childNodes[0];
      span = profileSpans.appendChild(document.createElement("span"));
      span.className = "sa-profile-name";
      span.textContent = username;

      // Remove username next to icon.
      container.firstChild.childNodes[1].textContent = "";
    }
  };
  const remove = async () => {
    const container = document.querySelector(".dropdown");
    if (container) {
      const username = await addon.auth.fetchUsername();
      container.firstChild.childNodes[1].textContent = username;
    }
    span?.remove();
    span = null;
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
