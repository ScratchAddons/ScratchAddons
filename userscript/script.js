// ==UserScript==
// @name         Scratch Addons
// @namespace    https://scratchaddons.com/
// @version      0.0.1
// @author
// @description
// @homepage     https://scratchaddons.com/
// @icon         https://cdn.jsdelivr.net/gh/RedGuy12/ScratchAddons@951e480c/images/icon.svg
// @updateURL    https://cdn.jsdelivr.net/gh/RedGuy12/ScratchAddons@951e480c/userscript/script.min.js
// @supportURL   https://scratchaddons.com/feedback
// @match        https://scratch.mit.edu/*
// @require      https:///cdn.jsdelivr.net/gh/RedGuy12/ScratchAddons@951e480c/content-scripts/prototype-handler.min.js
// @require      https:///cdn.jsdelivr.net/gh/RedGuy12/ScratchAddons@951e480c/content-scripts/load-redux.min.js
// @require      https:///cdn.jsdelivr.net/gh/RedGuy12/ScratchAddons@951e480c/content-scripts/fix-console.min.js
// @require      https:///cdn.jsdelivr.net/gh/RedGuy12/ScratchAddons@951e480c/libraries/common/cs/text-color.min.js
// @run-at       document-start
// @grant        none
// ==/UserScript==

document.documentElement.append(
  Object.assign(document.createElement("script"), {
    src: "https://cdn.jsdelivr.net/gh/RedGuy12/ScratchAddons@951e480c/userscript/module.min.js",
    type: "module",
  })
);
