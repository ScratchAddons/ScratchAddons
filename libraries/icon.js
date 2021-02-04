/*
  Icon.JS
  Copyright 2021 GrahamSH
  https://cdn.jsdelivr.net/gh/GrahamSH-LLK/icon.js/icon.js
 */
async function icon(icons) {
    let elements = document.querySelectorAll("i.icon");
    for (let item of [ ...elements ]) {
      let set = item.getAttribute("data-set");
      let icon = item.getAttribute("data-icon");
      let json;
      json = icons
      item.outerHTML = `<svg class="${item.getAttribute("class")}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true" focusable="false" width="1em" height="1em" style="-ms-transform: rotate(360deg); -webkit-transform: rotate(360deg); transform: rotate(360deg);" preserveAspectRatio="xMidYMid meet" viewBox="0 0 ${json.width} ${json.height}">${json.icons[icon].body}</svg>`
    };
  }
