import { isOnline } from "./common.js";
async function updateProfile() {
  let username = window.location.pathname.split("/users/")[1].split("/")[0];
  let online = await isOnline(username);
  let image = document.querySelector(".avatar");
  image.className = online ? "avatar online" : "avatar offline";
}
export default async function ({ addon, global, console, msg }) {
  await updateProfile();
  setInterval(updateProfile, 1000 * 60 * 2.5);
}
