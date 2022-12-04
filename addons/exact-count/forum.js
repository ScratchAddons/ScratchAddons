export default async function ({ addon, console }) {
  const cache = Object.create(null);
  addon.self.addEventListener("disabled", () => {
    for (const cached of Object.keys(cache)) {
      const post = document.getElementById(cached);
      const postsCounter = post.querySelector(".postleft dl").childNodes[6];
      postsCounter.textContent = cache[cached].original;
    }
  });
  addon.self.addEventListener("reenabled", () => {
    for (const cached of Object.keys(cache)) {
      const post = document.getElementById(cached);
      const postsCounter = post.querySelector(".postleft dl").childNodes[6];
      postsCounter.textContent = `${cache[cached].new} posts`;
    }
  });
  while (true) {
    const userbox = await addon.tab.waitForElement(".postleft dl", { markAsSeen: true });
    if (userbox.childNodes[6] && userbox.childNodes[6].nodeValue.includes("+")) {
      const postCountReal = Number(/(\d+)\+? posts?/.exec(userbox.childNodes[6].nodeValue)[1]);
      fetch("https://scratchdb.lefty.one/v3/forum/user/info/" + userbox.querySelector("a").innerText)
        .then((response) => response.json())
        .then((data) => {
          if (data.counts && data.counts.total && data.counts.total.count > postCountReal) {
            cache[userbox.closest(".blockpost").id] = {
              original: userbox.childNodes[6].textContent,
              new: data.counts.total.count,
            };
            userbox.childNodes[6].nodeValue = `${data.counts.total.count} posts`;
          }
        });
    }
  }
}
