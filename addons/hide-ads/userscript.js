export default async function ({ addon }) {
  let el;
  let url;
  const settings = { projects: "projects", studios: "studios", profiles: "users" };
  const matches = addon.settings.get("matchingStrings").map((obj) => obj.match.toLowerCase());

  url = window.location.href;

  if (url.includes("projects")) el = ".comment-container";
  else if (url.includes("studios")) el = ".comment-container";
  else if (url.includes("users")) el = ".top-level-reply";

  for (const key in settings) {
    console.log(key);
    if (settings.hasOwnProperty.call(settings, key)) {
      if (url.includes(settings[key]) && addon.settings.get(key)) {
        while (true) {
          const commentContainer = await addon.tab.waitForElement(el, { markAsSeen: true });
          matches.forEach((match) => {
            if (commentContainer.innerHTML.toLowerCase().includes(match)) {
              commentContainer.style.display = "none";
              return;
            }
          });
        }
      }
    }
  }
}
