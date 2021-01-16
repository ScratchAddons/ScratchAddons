export default async function ({ addon, global, console }) {
  let navbar = await addon.tab.waitForElement("#navigation ul, .site-nav", { markAsSeen: true });
  function load() {
    for (var i = 0; i < 4; i++) {
      if (navbar.classList.contains("site-nav")) {
        navbar.querySelectorAll("li a")[i].innerText = getSettings()[i].innerText;
        navbar.querySelectorAll("li a")[i].href = getSettings()[i].href;
      } else {
        let navSpans = navbar.querySelectorAll("li a span");
        navSpans[i].innerText = getSettings()[i].innerText;
        navSpans[i].parentElement.href = getSettings()[i].href;
      }
    }
  }
  load();
  addon.settings.removeEventListener("change", load);
  addon.settings.addEventListener("change", load);
}
function getSettings() {
  let data = [];
  for (var i = 1; i < 5; i++)
    data.push({
      innerText: addon.settings.get(`item${i}`),
      href: addon.settings.get(`itemurl${i}`),
    });
  return data;
}
