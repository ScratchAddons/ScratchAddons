export default async function ({ addon, global, console, msg }) {
  let posts = document.querySelectorAll(".blockpost");

  posts.forEach(async (i) => {
    let username = i.querySelector(".username").innerText;

    let left = i.querySelector(".postleft").children[0];

    const { userStatus, color } = await fetchStatus(username);

    if (userStatus) {
      let br = document.createElement("br");
      let status = document.createElement("i");
      status.title = msg("status-hover");
      status.innerText = userStatus;

      let dot = document.createElement("span");
      dot.title = msg("status-hover");
      dot.className = "my-ocular-dot";

      dot.style.backgroundColor = color;

      left.appendChild(br);
      left.appendChild(status);
      if (color) left.appendChild(dot);
    }
  });

  async function fetchStatus(username) {
    return new Promise(async (resolve, reject) => {
      let response = await fetch(`https://my-ocular.jeffalo.net/api/user/${username}`);
      let data = await response.json();
      resolve({
        userStatus: data.status,
        color: data.color,
      });
    });
  }
}
