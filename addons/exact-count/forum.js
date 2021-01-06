export default async function ({ addon, global, console }) {
<<<<<<< HEAD
  for (let userbox of document.querySelectorAll(".postleft dl")) {
    if (userbox.childNodes[6].nodeValue.includes("+")) {
      fetch("https://scratchdb.lefty.one/v2/forum/user/info/" + userbox.querySelector("a").innerText)
        .then((response) => response.json())
        .then((data) => {
          userbox.childNodes[6].nodeValue = `${data.counts.total.count}`;
=======
  while (true) {
    let userbox = await addon.tab.waitForElement(".postleft dl", { markAsSeen: true });
    if (userbox.childNodes[6] && userbox.childNodes[6].nodeValue.includes("+")) {
      fetch("https://scratchdb.lefty.one/v2/forum/user/info/" + userbox.querySelector("a").innerText)
        .then((response) => response.json())
        .then((data) => {
          userbox.childNodes[6].nodeValue = `${data.counts.total.count} posts`;
>>>>>>> b75a7312d02ba4231aa4e29bc3979ed509932170
        });
    }
  }
}
