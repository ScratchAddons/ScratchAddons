export default function ({ addon }) {
  const usernameHeader = document.querySelector(".header-text").firstElementChild;
  const userId = Object.assign(document.createElement("span"), {
    innerText: `#${Scratch.INIT_DATA.PROFILE.model.userId}`,
    className: "sa-user-id",
  });
  userId.style.display = "none"; // overridden by userstyle if the addon is enabled
  usernameHeader.appendChild(userId);
}
