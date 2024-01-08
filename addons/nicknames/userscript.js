import { getNicknames, occurence } from "./lib.js";

export default async function ({ addon, console }) {
  // Regular links
  occurence(addon, {
    selector: 'a[href^="/users/"]',
    toMatch: (el) => el.href,
    usernameRegex: /^https:\/\/scratch.mit.edu\/users\/(.+?)\/?$/,
    condition: (username, el) => el.textContent === username || el.textContent === `@${username}`,
    newText: (nickname, el) => (el.textContent.startsWith("@") ? "@" : "") + nickname,
  });

  // "user's profile" in messages
  occurence(addon, {
    selector: '.comment-message-info a[href^="/users"] span',
    toMatch: (el) => el.parentElement.href,
    usernameRegex: /^https:\/\/scratch.mit.edu\/users\/(.+?)\//,
    newText: (nickname) => `${nickname}'s profile`,
  });

  // Forum quotes
  occurence(addon, {
    selector: ".bb-quote-author",
    usernameRegex: /^(.*?) wrote:$/,
    newText: (nickname) => nickname + " wrote:",
  });

  // Account dropdown
  occurence(addon, {
    selector: ".profile-name, .sa-profile-name",
  });

  // scratchr2 account dropdown
  occurence(addon, {
    selector: ".user-name",
    replaceEl: (el) => el.childNodes[1],
  });

  if (window.copy_paste) {
    const originalCopyPaste = window.copy_paste;
    window.copy_paste = (postId) => {
      const usernameText = document.querySelector(`#${postId} .black.username`);
      const username = usernameText.dataset.saNicknamesUsername;
      if (username) {
        const nickname = usernameText.textContent;
        usernameText.textContent = username;
        originalCopyPaste(postId);
        usernameText.textContent = nickname;
      }
    };
  }

  addon.self.addEventListener("disabled", () => {
    document.querySelectorAll("[data-sa-nicknames-username]").forEach((el) => {
      el.dataset.saNicknamesNickname = el.textContent;
      el.textContent = el.dataset.saNicknamesUsername;
    });
  });
  addon.self.addEventListener("reenabled", () => {
    document.querySelectorAll("[data-sa-nicknames-nickname]").forEach((el) => {
      el.textContent = el.dataset.saNicknamesNickname;
      delete el.dataset.saNicknamesNickname;
    });
  });
}
