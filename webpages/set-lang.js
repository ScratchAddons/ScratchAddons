import getDirection from "./rtl-list.js";

document.documentElement.lang = chrome.i18n.getUILanguage();
document.body.dir = getDirection(chrome.i18n.getUILanguage());
