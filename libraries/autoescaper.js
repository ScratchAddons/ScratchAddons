/*
  Auto-escape input to prevent XSS.
  Usage: autoescaper`trusted code ${untrusted value}`
*/

const _textarea = document.createElement("textarea");

const escapeHTML = str => {
    _textarea.innerHTML = str;
    const val = _textarea.innerText.replace(/'/g, "&#39;").replace(/"/g, "&quot;");
    _textarea.innerHTML = "";
    return val;
};
const autoescaper = (strings, ...dangerous) => {
    let r = '';
    let i = 0;
    for (; i < strings.length; i++) {
        r += strings[i];
        if (i !== dangerous.length) r += escapeHTML(String(dangerous[i]));
    }
    return r;
};
export default autoescaper;
export {escapeHTML};