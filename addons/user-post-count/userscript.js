export default async function ({ addon }) {

  const usernameHeader = document.querySelector(".header-text > h2");
  if (!usernameHeader) return;

  const username = usernameHeader.textContent.trim();
  if (!username) return;

  const postCountSpan = document.createElement("span");
  postCountSpan.className = "sa-user-post-count";
  postCountSpan.innerText = "Loading messages count...";

  usernameHeader.insertAdjacentElement("afterend", postCountSpan);

  try {
    const res = await fetch(`https://api.scratch.mit.edu/users/${username}/messages/count`);
    if (!res.ok) throw new Error("Network response not ok");

    const data = await res.json();

    postCountSpan.innerText = `✉️ Messages: ${data.count ?? 0}`;
  } catch (e) {
    postCountSpan.innerText = "✉️ Messages: N/A";
    console.error("[PostCountAddon] Error fetching message count:", e);
  }
}
