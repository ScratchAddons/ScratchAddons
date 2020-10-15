export default async function ({ addon, console }) {
  await addon.tab.waitForElement(".youtube-player");
  document.querySelector(".youtube-player").setAttribute("allowfullscreen", true);
  document.querySelector(".youtube-player").src += ""; // reload video
}
