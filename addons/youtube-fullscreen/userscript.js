export default async function (/** @type {typeof UserscriptUtils} */ { addon, console }) {
  const player = await addon.tab.waitForElement(".youtube-player");
  player.setAttribute("allowfullscreen", true);
  player.src += ""; // reload video
}
