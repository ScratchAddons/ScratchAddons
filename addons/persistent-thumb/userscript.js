export default async function ({ addon, global, console }) {
  const el = await addon.tab.waitForElement("div.stage_green-flag-overlay-wrapper_2hUi_.box_box_2jjDp", {
    markAsSeen: true,
  });

  const projectId = window.location.pathname.split("/")[2];
  const thumb = `https://uploads.scratch.mit.edu/get_image/project/${projectId}_480x360.png`;
  setThumb();

  addon.self.addEventListener("disabled", () => (el.style.backgroundImage = "none"));
  addon.self.addEventListener("reenabled", () => setThumb());

  function setThumb() {
    el.style.backgroundImage = `url(${thumb})`;
  }
}
