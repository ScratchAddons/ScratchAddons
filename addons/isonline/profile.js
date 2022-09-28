import { isOnline } from "./common.js";
export default async function ({ addon, global, console, msg }) {
  console.log("hi");
  let username = window.location.pathname.split("/users/")[1].split("/")[0];
  let res = await fetch(`https://api.scratch.mit.edu/users/${username}`);
  let data = await res.json();
  let { status } = data.profile;
  let projectId = status.split("##$")[1]?.split("$##")[0];
  if (!projectId) return;
  let online = await isOnline(projectId);
  let usernameText = document.querySelector(".header-text > h2");
  usernameText.style.color = online ? "green" : "red";
}
