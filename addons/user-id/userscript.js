export default function ({ addon }) {
  const usernameHeader = document.querySelector(".header-text").firstElementChild;
  const userId = Object.assign(document.createElement("span"), {
    innerText: `#${Scratch.INIT_DATA.PROFILE.model.userId}`,
    className: "sa-user-id",
  });
  addon.tab.displayNoneWhileDisabled(userId);
  usernameHeader.appendChild(userId);
}
