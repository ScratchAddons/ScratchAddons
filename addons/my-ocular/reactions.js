export default async function ({ addon, global, console, msg }) {
  let posts = document.querySelectorAll(".blockpost");

  posts.forEach(async (i) => {
    let postID = i.id.split("p")[1];

    let footer = i.querySelector(".postfootright").children[0];

    let viewOnOcularContainer = document.createElement("li");
    let viewOnOcular = document.createElement("a");
    viewOnOcular.innerText = `🔍 ocular`;
    viewOnOcular.title = msg("view-on-ocular");
    viewOnOcular.href = `https://ocular.jeffalo.net/post/${postID}`;
    viewOnOcularContainer.appendChild(document.createTextNode("| "));
    viewOnOcularContainer.appendChild(viewOnOcular);
    viewOnOcularContainer.appendChild(document.createTextNode(" |"));
    footer.insertAdjacentElement("afterbegin", viewOnOcularContainer);

    if (addon.auth.isLoggedIn) {
      let reactionList = document.createElement("li"); // it's a list item, because its inside the postfootright list. so it's basically a nested list
      async function makeReactionList() {
        const reactions = await fetchReactions(postID);

        reactionList.innerHTML = "";
        reactions.forEach((reaction) => {
          let reactionButton = document.createElement("span");
          reactionButton.innerText = `${reaction.emoji} ${reaction.reactions.length}`;

          reactionButton.className = "my-ocular-reaction-button";
          if (reaction.reactions.find((r) => r.user === addon.auth.username)) {
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
  });

  async function fetchReactions(id) {
    const response = await fetch(`https://my-ocular.jeffalo.net/api/reactions/${id}`);
    return response.json();
  }
}
