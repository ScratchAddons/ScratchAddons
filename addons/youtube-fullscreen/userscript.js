export default async function ({ addon, console }) {
  const player = await addon.tab.waitForElement(".youtube-player");

  function setFullscreenEnabled(enabled) {
    if (enabled) player.setAttribute("allowfullscreen", true);
    else player.removeAttribute("allowfullscreen");
    player.src += ""; // reload video
  }
  setFullscreenEnabled(true);
  addon.self.addEventListener("disabled", () => setFullscreenEnabled(false));
  addon.self.addEventListener("reenabled", () => setFullscreenEnabled(true));
}
