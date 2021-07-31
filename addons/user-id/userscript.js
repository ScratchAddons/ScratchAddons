export default function ({ addon }) {
  let usernameHeader = document.querySelector(".header-text").firstElementChild;
  const userId = Object.assign(document.createElement("span"), {
    innerText: `#${Scratch.INIT_DATA.PROFILE.model.userId}`,
    className: "sa-user-id",
  });
  userId.style.color = "lightgrey";

  usernameHeader.appendChild(userId);
}
