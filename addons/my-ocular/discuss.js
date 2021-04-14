export default async function ({ addon, global, console, msg }) {
  let posts = document.querySelectorAll(".blockpost");

  let ocularReactionColor = getComputedStyle(document.querySelector(".blockpost").querySelector(".box"))
    .backgroundColor; // match post header
  document.documentElement.style.setProperty("--ocular-reaction-color", ocularReactionColor); // match post header

  let ocularReactionBGColor = getComputedStyle(document.querySelector(".blockpost").querySelector(".postleft"))
    .backgroundColor; // match post header
  document.documentElement.style.setProperty("--ocular-reaction-bg-color", ocularReactionBGColor); // match post header

  posts.forEach(async (i) => {
    let username = i.querySelector(".username").innerText;
    let postID = i.id.split("p")[1];

    let left = i.querySelector(".postleft").children[0];
    let footer = i.querySelector(".postfootright").children[0];

    let viewOnOcularContainer = document.createElement("li");
    let viewOnOcular = document.createElement("a");
    viewOnOcular.innerText = "🔍";
    viewOnOcular.title = msg("view-on-ocular");
    viewOnOcular.href = `https://ocular.jeffalo.net/post/${postID}`;
    viewOnOcularContainer.appendChild(document.createTextNode("| "));
    viewOnOcularContainer.appendChild(viewOnOcular);
    viewOnOcularContainer.appendChild(document.createTextNode(" |"));
    footer.insertAdjacentElement("afterbegin", viewOnOcularContainer);

    const { userStatus, color } = await fetchStatus(username);

    if (addon.auth.isLoggedIn) {
      let reactionList = document.createElement("li"); // it's a list item, because its inside the postfootright list. so it's basically a nested list
      async function makeReactionList() {
        const reactions = await fetchReactions(postID);

        reactionList.innerHTML = "";
        reactions.forEach((reaction) => {
          let reactionButton = document.createElement("span");
          reactionButton.innerText = `${reaction.emoji} ${reaction.reactions.length}`;

          reactionButton.className = "my-ocular-reaction-button";
          if (reaction.reactions.find((r) => r.user == addon.auth.username)) {
            reactionButton.classList.add("selected");
          }

          reactionButton.addEventListener("click", (e) => {
            e.preventDefault();
            let ocular = window.open(
              `https://ocular.jeffalo.net/react/${postID}?emoji=${reaction.emoji}`,
              "ocular",
              "width=300,height=300"
            );
            let timer = setInterval(checkClosed, 500);

            function checkClosed() {
              if (ocular.closed) {
                clearInterval(timer);
                makeReactionList();
              }
            }
          });

          reactionList.appendChild(reactionButton);
        });
      }
      footer.insertAdjacentElement("afterbegin", reactionList);

      makeReactionList();
    }

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

  async function fetchReactions(id) {
    return new Promise(async (resolve, reject) => {
      let response = await fetch(`https://my-ocular.jeffalo.net/api/reactions/${id}`);
      let data = await response.json();
      resolve(data);
    });
  }
}
