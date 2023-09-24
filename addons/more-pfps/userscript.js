export default async function ({ addon, console }) {
  const linkRegex = /(?:https?:\/\/scratch.mit.edu)?\/users\/([a-zA-Z0-9_-]{3,})\/?/;
  const noPfpQueries = [
    ".social-message-content", // What's Happening?
    ".studio-project-info", // Studio projects
    ".thumbnail-title", // Explore projects
    ".actor", // What I've been doing
    ".user.thumb.item", // Following / Followers
    ".comment .info .name", // scratchr2 comment usernames
    ".postleft", // forum post authors
  ];

  const getPfp = async (username) => {
    const response = await (await fetch(`https://api.scratch.mit.edu/users/${username}`)).json();
    if (!("profile" in response)) {
      console.log(`Unexpected response from ${username}:`, response);
      return null;
    }
    return response.profile.images["32x32"];
  };

  console.log(document.querySelectorAll("a"));
  const addPfp = async (element) => {
    const match = element.href.match(linkRegex);
    if (!match) {
      return;
    }
    if (element.children.length !== 0) {
      return;
    }
    const username = match[1];
    if (noPfpQueries.some((query) => element.closest(query))) {
      return;
    }
    const pfp = await getPfp(username);
    if (pfp === null) {
      return;
    }
    const pfpElement = document.createElement("img");
    pfpElement.src = pfp;
    pfpElement.classList.add("sa-more-pfps-pfp");
    const trimmedContent = element.textContent.trim();
    if (trimmedContent !== username && trimmedContent !== `@${username}`) {
      pfpElement.classList.add("sa-more-pfps-in-href");
    }
    addon.tab.displayNoneWhileDisabled(pfpElement);
    element.prepend(pfpElement);
    element.classList.add("sa-more-pfps-link");
  };

  document.querySelectorAll("a").forEach(addPfp);
}
