import { isOnline, getProjectId } from "./common.js";
export default async function ({ addon, global, console, msg }) {
  console.log("hi");
  let username = window.location.pathname.split("/users/")[1].split('/')[0];
    let projectId = await getProjectId(username);
  if (!projectId) return;
  let online = await isOnline(projectId);
  let usernameText = document.querySelector(".header-text > h2");
  usernameText.style.color = online ? "green" : "red";
}
