export default async function ({ addon, global, console }) {
  while (true) {
    let userbox = await addon.tab.waitForElement(".postleft dl", { markAsSeen: true });
    if (userbox.childNodes[6] && userbox.childNodes[6].nodeValue.includes("+")) {
      const postCountReal = Number(
        /(?:(\d+)\+ posts|(\d\d\d?) posts|(1) post)/
          .exec(userbox.childNodes[6].nodeValue)
          .filter((n) => typeof n === "string")[1]
      );
      fetch("https://scratchdb.lefty.one/v3/forum/user/info/" + userbox.querySelector("a").innerText)
        .then((response) => response.json())
        .then((data) => {
          if (data.counts && data.counts.total && data.counts.total.count > postCountReal) {
            userbox.childNodes[6].nodeValue = `${data.counts.total.count} posts`;
          }
        });
    }
  }
}
