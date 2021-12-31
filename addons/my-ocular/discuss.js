export default async function ({ addon, global, console, msg }) {
  let posts = document.querySelectorAll(".blockpost");
  let cache = {};

  posts.forEach(async (i) => {
    let username = i.querySelector(".username").innerText;

    let left = i.querySelector(".postleft").children[0];

    const { userStatus, color } = await fetchStatus(username);

    if (userStatus) {
      let br = document.createElement("br");
      addon.tab.displayNoneWhileDisabled(br);
      let status = document.createElement("i");
      addon.tab.displayNoneWhileDisabled(status);
      status.title = msg("status-hover");
      status.innerText = userStatus;

      let dot = document.createElement("span");
      addon.tab.displayNoneWhileDisabled(dot, { display: "inline-block" });
      dot.title = msg("status-hover");
      dot.className = "my-ocular-dot";

      dot.style.backgroundColor = color;

      left.appendChild(br);
      left.appendChild(status);
      if (color) left.appendChild(dot);
    }
  });

  function fetchStatus(username) {
    if (cache[username]) return cache[username];
    return (cache[username] = new Promise(async (resolve) => {
      const response = await fetch(`https://my-ocular.jeffalo.net/api/user/${username}`);
      const data = await response.json();
      resolve({
        userStatus: data.status,
        color: data.color,
      });
    }));
  }
}
