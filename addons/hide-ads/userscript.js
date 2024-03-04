export default async function ({ addon, console }) {
  let el;
  let url;
  const settings = { projects: "projects", studios: "studios", profiles: "users" };
  const matches = addon.settings.get("matchingStrings").map((obj) => obj.match.toLowerCase());

  url = window.location.href;

  /* 
  PROFILES
  top-level-reply

  comment
  info
  content.innerText

  replies
  reply
  comment
  content.innerText

  PROJECTS and STUDIOS
  comment-container

  comment
  comment-body
  comment-bubble
  comment-content
  emoji-text.innerText

  replies
  comment
  comment-body
  comment-bubble
  comment-content.lastChild.innerText (in replies there are two emoji-texts)
  */

  if (url.includes("projects")) el = ".comment-container";
  else if (url.includes("studios")) el = ".comment-container";
  else if (url.includes("users")) el = ".top-level-reply";

  //dsis = does string contain string
  function dsis(comment, string) {
    return typeof comment === "object"
      ? comment.innerHTML.toLowerCase().includes(string.toLowerCase())
      : comment.toLowerCase().includes(string.toLowerCase());
  }

  for (const key in settings) {
    if (settings.hasOwnProperty.call(settings, key)) {
      if (url.includes(settings[key]) && addon.settings.get(key)) {
        while (true) {
          const commentsContainer = await addon.tab.waitForElement(el, { markAsSeen: true });
          console.log("el found");
          matches.forEach((match) => {
            if (dsis(commentsContainer.innerHTML, match)) {
              console.log("match found");
              //We have a match somewhere, now we need to figure out where

              if (dsis(commentsContainer.querySelector("div.comment"), match)) {
                //If this is true, the first comment is what contains the advertising, therefore we can hide them all
                commentsContainer.style.display = "none";
              } else {
                //The first comment is not the offending comment, we search replies now
                if (url.includes(settings["profiles"])) {
                  //Projects and studios are handled below
                  const replies = commentsContainer.querySelectorAll("li.reply");
                  replies.forEach((reply) => {
                    if (dsis(reply, match)) {
                      reply.style.display = "none";
                    }
                  });
                }
              }
            }
          });

          //Project and studio replies are not loaded when the comment container is, which means we have to search for them separately
          const commentReply = await addon.tab.waitForElement("div.replies>div.comment", { markAsSeen: true });
          matches.forEach((match) => {
            if (dsis(commentReply, match)) {
              commentReply.style.display = "none";
            }
          });
        }
      }
    }
  }
}
