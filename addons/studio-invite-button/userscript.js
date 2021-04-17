export default async function ({ addon, console, msg }) {
  // invites a user to the studio
  function inviteToStudio(user) {
    return fetch(
      `https://scratch.mit.edu/site-api/users/curators-in/${
        location.pathname.split("/")[2]
      }/invite_curator/?usernames=${user}`,
      {
        headers: {
          "x-csrftoken": addon.auth.csrfToken,
          "x-requested-with": "XMLHttpRequest",
          referer: "https://scratch.mit.edu",
        },
        body: null,
        method: "PUT",
      }
    );
  }
  addon.tab.waitForElement("#description").then(async (description) => {
    // checks if the user is a manager and the URL is correct
    if (description.classList.contains("editable")) {
      while (true) {
        const comment = await addon.tab.waitForElement(".comment", { markAsSeen: true });
        const inviteButton = document.createElement("span"); // create the button
        inviteButton.innerText = msg("Invite");
        inviteButton.classList.add("actions", "report");
        inviteButton.style.visibility = "hidden";
        inviteButton.style.color = "rgb(157, 157, 157)";

        comment.querySelector(".actions-wrap").appendChild(inviteButton);
        inviteButton.addEventListener("click", function listener() {
          inviteToStudio(comment.querySelector(".name").textContent.trim())
            .then((resp) => resp.text())
            .then((resp) => {
              try {
                const parsed = JSON.parse(resp);
                // handle the different possible responses
                if (parsed.status === "success") {
                  inviteButton.innerText = msg("invited");
                } else if (parsed.message.endsWith("is already a curator of this studio")) {
                  inviteButton.innerText = msg("alreadyCurator");
                } else {
                  throw Error(0);
                }
              } catch (err) {
                inviteButton.innerText = msg("whoops");
              }
              comment.querySelector(".reply").click();
              inviteButton.style.fontWeight = "bold";
              inviteButton.removeEventListener("click", listener);
              inviteButton.classList.remove("actions"); // after it's clicked it can't be clicked again
            });
        });
      }
    }
  });
}
