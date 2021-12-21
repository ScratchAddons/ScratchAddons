// //
import { escapeHTML } from "../libraries/common/cs/autoescaper.js";
const DOLLARS = ["$1", "$2", "$3", "$4", "$5", "$6", "$7", "$8", "$9"];
let initialUrl = location.href;
let path = new URL(initialUrl).pathname.substring(1);
// //

if (path === "discuss/3/topic/add/") {
  window.addEventListener("load", () => forumWarning("forumWarning"));
} else if (path.startsWith("discuss/topic/")) {
  window.addEventListener("load", () => {
    if (document.querySelector('div.linkst > ul > li > a[href="/discuss/18/"]')) {
      forumWarning("forumWarningGeneral");
    }
  });
}

function forumWarning(key) {
  let postArea = document.querySelector("form#post > label");
  if (postArea) {
    var errorList = document.querySelector("form#post > label > ul");
    if (!errorList) {
      let typeArea = postArea.querySelector("strong");
      errorList = document.createElement("ul");
      errorList.classList.add("errorlist");
      postArea.insertBefore(errorList, typeArea);
    }
    let addonError = document.createElement("li");
    let reportLink = document.createElement("a");
    const uiLanguage = chrome.i18n.getUILanguage();
    const localeSlash = uiLanguage.startsWith("en") ? "" : `${uiLanguage.split("-")[0]}/`;
    const utm = `utm_source=extension&utm_medium=forumwarning&utm_campaign=v${chrome.runtime.getManifest().version}`;
    reportLink.href = `https://scratchaddons.com/${localeSlash}feedback/?ext_version=${
      chrome.runtime.getManifest().version
    }&${utm}`;
    reportLink.target = "_blank";
    reportLink.innerText = chrome.i18n.getMessage("reportItHere");
    let text1 = document.createElement("span");
    text1.innerHTML = escapeHTML(chrome.i18n.getMessage(key, DOLLARS)).replace("$1", reportLink.outerHTML);
    addonError.appendChild(text1);
    errorList.appendChild(addonError);
  }
}
