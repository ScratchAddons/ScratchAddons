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
      let reactionMenuContainer = document.createElement("li");
      reactionMenuContainer.className = "my-ocular-reaction-menu";
      let reactionMenuButton = document.createElement("span");
      reactionMenuButton.className = "my-ocular-reaction-menu-button";
      reactionMenuButton.innerText = "😀";
      reactionMenuButton.title = msg("add-reaction");
      reactionMenuContainer.appendChild(document.createTextNode(" "));
      reactionMenuContainer.appendChild(reactionMenuButton);
      reactionMenuContainer.appendChild(document.createTextNode(" "));

      let reactionMenu = document.createElement("span");
      reactionMenu.className = "my-ocular-popup";
      reactionMenuContainer.appendChild(reactionMenu);
      reactionMenuButton.addEventListener("click", (e) => {
        e.stopPropagation();
        reactionMenuContainer.classList.toggle("open");
        for (let otherMenuContainer of document.querySelectorAll(".my-ocular-reaction-menu")) {
          if (otherMenuContainer === reactionMenuContainer) continue;
          otherMenuContainer.classList.remove("open");
        }
      });
      document.body.addEventListener("click", () => reactionMenuContainer.classList.remove("open"));
      reactionMenu.addEventListener("click", (e) => e.stopPropagation()); /* don't close the menu when it's clicked */

      let reactionList = document.createElement("li"); // it's a list item, because its inside the postfootright list. so it's basically a nested list
      async function makeReactionList() {
        const reactions = await fetchReactions(postID);

        reactionList.innerHTML = "";
        reactionMenu.innerHTML = "";
        reactions.forEach((reaction) => {
          let reactionButton = reaction.reactions.length !== 0 ? document.createElement("span") : null;
          if (reactionButton) reactionButton.className = "my-ocular-reaction-button";
          if (reactionButton) reactionButton.innerText = `${reaction.emoji} ${reaction.reactions.length}`;

          let reactionMenuItem = document.createElement("span");
          reactionMenuItem.className = "my-ocular-reaction-button";
          reactionMenuItem.innerText = reaction.emoji;

          if (reaction.reactions.find((r) => r.user === addon.auth.username)) {
            if (reactionButton) reactionButton.classList.add("selected");
            reactionMenuItem.classList.add("selected");
          }

          if (reactionButton) {
            let tooltip = document.createElement("span");
            tooltip.className = "my-ocular-popup";
            if (reaction.reactions.length <= 5)
              tooltip.innerText = reaction.reactions.map((user) => user.user).join(", ");
            else
              tooltip.innerText =
                reaction.reactions
                  .slice(0, 5)
                  .map((user) => user.user)
                  .join(", ") + " and others";
            reactionButton.appendChild(tooltip);
          }

          function react() {
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
          }
          if (reactionButton) reactionButton.addEventListener("click", react);
          reactionMenuItem.addEventListener("click", react);

          if (reactionButton) reactionList.appendChild(reactionButton);
          reactionMenu.appendChild(reactionMenuItem);
        });
        if (reactions.some((reaction) => reaction.reactions.length !== 0)) {
          reactionList.appendChild(document.createTextNode("|"));
        }
      }
      footer.insertAdjacentElement("afterbegin", reactionMenuContainer);
      footer.insertAdjacentElement("afterbegin", reactionList);

      makeReactionList();
    }
  });

  async function fetchReactions(id) {
    const response = await fetch(`https://my-ocular.jeffalo.net/api/reactions/${id}`);
    return response.json();
  }
}
