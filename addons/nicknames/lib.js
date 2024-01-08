export const getNicknames = () => {
  const storageItem = localStorage.getItem("sa-nicknames");
  if (storageItem === null) {
    localStorage.setItem("sa-nicknames", "{}");
    return {};
  }
  return JSON.parse(storageItem);
};

let addon = null;

export const registerAddon = (toRegister) => {
  addon = toRegister;
};

/**
 * @callback ReplaceEl
 * @param {HTMLElement} el The element that `waitForElement` returned.
 * @returns {HTMLElement} The new element.
 *
 * @callback ToMatch
 * @param {HTMLElement} el The element that has the username in it.
 * @returns {string} The string to match for a username.
 *
 * @callback Condition
 * @param {string} username The username matched via the `usernameRegex`.
 * @param {HTMLElement} el The element that has the username in it.
 * @returns {boolean} Whether to replace the text.
 *
 * @callback NewText
 * @param {string} nickname The nickname of the user matched via the `usernameRegex`.
 * @param {HTMLElement} el The element that has the username in it.
 * @returns {string} The text to replace the current text with.
 */

/**
 * Register an occurence of a username.
 * @param {object} addon The `addon` object.
 * @param {object} options The options.
 * @param {string} options.selector The selector to pass to `waitForElement`.
 * @param {ReplaceEl} [options.replaceEl] Returns a different element where the element actually is. Useful for text nodes or other things a selector can't easily do. Gets in the found element.
 * @param {ToMatch} [options.toMatch] Returns the string to match for a username. Gets in the found element. Defaults to the text content.
 * @param {RegExp} [options.usernameRegex] The regular expression to match the username in `toMatch`. If it doesn't match, the element will be discared. The username should be in the 1st capture group. Defaults to `/(.*)/`.
 * @param {Condition} [options.condition] Returns whether to replace the text. Gets in the username and the found element. Defaults to true.
 * @param {NewText} [options.newText] Returns the string to replace the text with. Gets in the nickname and the found element. Defaults to just the nickname.
 */
export const occurence = async (
  addon,
  {
    selector,
    replaceEl = (el) => el,
    toMatch = (el) => el.textContent,
    usernameRegex = /(.*)/,
    condition = () => true,
    newText = (nickname) => nickname,
  }
) => {
  while (true) {
    const el = replaceEl(
      await addon.tab.waitForElement(selector, { markAsSeen: true, condition: () => !addon.tab.disabled })
    );

    const match = toMatch(el).match(usernameRegex);
    if (!match) {
      continue;
    }
    const username = match[1];
    if (condition(username, el) && username in nicknames) {
      if ("dataset" in el) {
        el.dataset.saNicknamesUsername = username;
      } else {
        el.parentElement.dataset.saNicknamesUsername = username;
      }
      el.textContent = newText(nicknames[username], el);
    }
  }
};

const nicknames = getNicknames();
