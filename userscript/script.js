// ==UserScript==
// @name         Scratch Addons
// @namespace    https://scratchaddons.com/
// @version      0.0.1
// @author
// @description
// @homepage     https://scratchaddons.com/
// @icon         https://cdn.jsdelivr.net/gh/RedGuy12/ScratchAddons@cdd1673/images/icon.svg
// @updateURL    https://cdn.jsdelivr.net/gh/RedGuy12/ScratchAddons@cdd1673/userscript/script.js
// @supportURL   https://scratchaddons.com/feedback
// @match        https://scratch.mit.edu/*
// @require      https:///cdn.jsdelivr.net/gh/RedGuy12/ScratchAddons@cdd1673/content-scripts/prototype-handler.js
// @require      https:///cdn.jsdelivr.net/gh/RedGuy12/ScratchAddons@cdd1673/content-scripts/load-redux.js
// @require      https:///cdn.jsdelivr.net/gh/RedGuy12/ScratchAddons@cdd1673/content-scripts/fix-console.js
// @require      https:///cdn.jsdelivr.net/gh/RedGuy12/ScratchAddons@cdd1673/libraries/common/cs/text-color.js
// @run-at       document-start
// @grant        none
// ==/UserScript==

document.documentElement.append(
  Object.assign(document.createElement("script"), {
    src: "https://cdn.jsdelivr.net/gh/RedGuy12/ScratchAddons@cdd1673/content-scripts/inject/userscript.min.js",
    type: "module",
  })
);
