export default async function ({ addon, console }) {
  src = window.location.href = window.location.href + "fullscreen";
  const project = await addon.tab.waitForElement(".action-buttons");
  project.innerHTML +='<button class="button action-button copy-link-button"><a href="' + src + '<span>Run In Fullscreen</span></a></button>';
}
