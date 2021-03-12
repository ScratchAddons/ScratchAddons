export default async function ({ addon, global, console }) {
  while (true) {
    let userbox = await addon.tab.waitForElement(".postleft dl", { markAsSeen: true });
    if (userbox.childNodes[6] && userbox.childNodes[6].nodeValue.includes("+")) {
      fetch("https://scratchdb.lefty.one/v3/forum/user/info/" + userbox.querySelector("a").innerText)
        .then((response) => response.json())
        .then((data) => {
          userbox.childNodes[6].nodeValue = `${data.counts.total.count} posts`;
        });
    }
  }
}
