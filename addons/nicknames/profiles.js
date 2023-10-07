import { getNicknames } from "./lib.js";

export default async function ({ addon, console, msg }) {
  const locationElement = document.querySelector(".location");
  const userElement = document.querySelector("h2");
  const nicknames = getNicknames();

  const username = userElement.textContent;
  const hasNickname = username in nicknames;
  if (hasNickname) {
    userElement.textContent = nicknames[username];
  }

  const group = document.createElement("span");
  group.classList.add("group");
  const changeNickname = document.createElement("span");
  const changeNicknameLink = document.createElement("a");
  if (hasNickname) {
    changeNickname.append(`${username} `);
    changeNicknameLink.textContent = `(${msg("change-nickname")})`;
  } else {
    changeNicknameLink.textContent = msg("set-nickname");
  }
  changeNickname.append(changeNicknameLink);
  locationElement.insertAdjacentElement("beforebegin", group);
  locationElement.insertAdjacentElement("beforebegin", changeNickname);

  changeNicknameLink.addEventListener("click", async () => {
    const nickname = await addon.tab.prompt(msg("change-nickname"), msg("which-nickname", { username }), username);
    if (nickname === null) {
      return;
    }
    if (nickname === username) {
      const newNicknames = { ...nicknames };
      delete newNicknames[username];
      localStorage.setItem("sa-nicknames", JSON.stringify(newNicknames));
    } else {
      localStorage.setItem("sa-nicknames", JSON.stringify({ ...nicknames, [username]: nickname }));
    }
    location.reload();
  });
}
