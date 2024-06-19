export default async function ({ addon, console, msg }) {
  const username = Scratch.INIT_DATA.PROFILE.model.username;
  let data = await fetchStatus(username);

  if (typeof data.userStatus !== "string") return;

  const span = document.createElement("span");
  span.textContent = data.userStatus;
  span.className = "sa-ocular-status";
  span.title = msg("status-hover");

  span.style.fontStyle = "italic";
  span.style.display = "inline-block !important";

  const dot = document.createElement("span");
  dot.style.backgroundColor = data.color;
  span.appendChild(dot);

  addon.tab.appendToSharedSpace({
    space: "afterProfileCountry",
    element: span,
    order: 9, // set back due to width of element
  });

  addon.settings.addEventListener("change", updateOcular);
  addon.self.addEventListener("disabled", () => updateOcular(true));
  addon.self.addEventListener("reenabled", () => updateOcular());

  async function fetchStatus(username) {
    const response = await fetch(`https://my-ocular.jeffalo.net/api/user/${username}`);
    const data = await response.json();
    return {
      userStatus: data.status?.replace(/\n/g, " "),
      color: data.color,
    };
  }

  async function updateOcular(disabled) {
    let span = document.querySelector(".sa-ocular-status");
    let isMyProfile = addon.settings.get("show-status") === "others" && username === (await addon.auth.fetchUsername());
    if (isMyProfile || addon.settings.get("profile") === false || disabled === true) {
      span.style.display = "none";
    } else {
      span.style.display = "inline-block";
    }
  }
}
