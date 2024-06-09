/* global $, paste */

let forumIdAddon = null;
let betterQuoterAddon = null;
let isSetup = false;

export function setupForumId(addon) {
  if (!forumIdAddon) {
    forumIdAddon = addon;
  }
  setup();
}

export function setupBetterQuoter(addon) {
  if (!betterQuoterAddon) {
    betterQuoterAddon = addon;
  }
  setup();
}

export function getPostText(id, post, selection) {
  return new Promise((resolve) => {
    const selectionStr = selection.toString();
    if (
      !betterQuoterAddon ||
      betterQuoterAddon?.self?.disabled ||
      !(
        selectionStr &&
        selection.anchorNode &&
        post.contains(selection.anchorNode) &&
        selection.focusNode &&
        post.contains(selection.focusNode)
      )
    ) {
      $.ajax("/discuss/post/" + id.substr(1) + "/source/").done(function (data) {
        resolve(data);
      });
    } else {
      resolve(getSelectionBBCode(selection));
    }
  });
}

export function getIDLink(id, name, addSpace) {
  return `[url=https://scratch.mit.edu/discuss/post/${id}/]${name}[/url]${addSpace ? " " : ""}`;
}

function getSelectionBBCode(selection) {
  const html = document.createElement("div");
  if (selection.rangeCount > 0) {
    // if something is selected
    const range = selection.getRangeAt(0);
    const clonedSelection = range.cloneContents();
    html.appendChild(clonedSelection);
  } else {
    // nothing is selected
    return "";
  }

  const textNodes = getTextNodes(html, ["code", "sa-copyCodeDiv"]);
  for (const textNode of textNodes) {
    textNode.textContent = textNode.textContent.replaceAll("[", "[[]");
  }

  // new lines
  const lineBreaks = html.querySelectorAll("br");
  for (const br of lineBreaks) br.insertAdjacentText("afterend", "\n");

  // images and smileys
  const smilieReplaces = Object.assign(Object.create(null), {
    smile: ":)",
    neutral: ":|",
    sad: ":(",
    big_smile: ":D",
    yikes: ":o",
    wink: ";)",
    hmm: ":/",
    tongue: ":P",
    lol: ":lol:",
    mad: ":mad:",
    roll: ":rolleyes:",
    cool: ":cool:",
  });

  const imgs = html.querySelectorAll("img");
  for (const img of imgs) {
    if (
      /\/\/cdn\.scratch\.mit\.edu\/scratchr2\/static\/__[a-z0-9]{32}__\/djangobb_forum\/img\/smilies\/[a-z_]{3,9}\.png/.test(
        img.src
      )
    ) {
      if (smilieReplaces[img.src.split("smilies/")[1].split(".")[0]]) {
        img.parentNode.insertBefore(
          document.createTextNode(smilieReplaces[img.src.split("smilies/")[1].split(".")[0]]),
          img
        );
      } else img.parentNode.insertBefore(document.createTextNode(`[img${img.src}[/img]`), img);
    } else img.parentNode.insertBefore(document.createTextNode(`[img]${img.getAttribute("src")}[/img]`), img);
  }

  // bold, italic, underline, strikethrough, big, small and color
  const bbReplaces = {
    italic: "i",
    bold: "b",
    big: "big",
    small: "small",
    underline: "u",
    strikethrough: "s",
  };
  const spans = html.querySelectorAll("span");
  for (const span of spans) {
    if (span.className.startsWith("bb-")) {
      span.insertAdjacentText("afterbegin", `[${bbReplaces[span.className.slice(3)]}]`);
      span.insertAdjacentText("beforeend", `[/${bbReplaces[span.className.slice(3)]}]`);
    } else if (span.style.color) {
      const color = span.style.color;

      function componentToHex(c) {
        const hex = c.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
      }

      function rgbToHex(r, g, b) {
        return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
      }

      if (color.startsWith("rgb")) {
        const rgbValues = color
          .slice(4, color.length - 1)
          .split(/, ?/)
          .map((x) => Number(x));

        span.insertAdjacentText("afterbegin", `[color=${rgbToHex(...rgbValues).toUpperCase()}]`);
      } else span.insertAdjacentText("afterbegin", `[color=${color}]`);
      span.insertAdjacentText("beforeend", "[/color]");
    }
  }

  // links
  // todo: try and guess where dictionary/wiki/wp etc. tags are being used?
  const links = html.querySelectorAll("a");
  for (const link of links) {
    link.insertAdjacentText("afterbegin", `[url=${link.href}]`);
    link.insertAdjacentText("beforeend", "[/url]");
  }

  // center
  const divs = html.querySelectorAll("div");
  for (const div of divs) {
    if (div.style.textAlign === "center") {
      div.insertAdjacentText("afterbegin", "[center]");
      div.insertAdjacentText("beforeend", "[/center]");
    }
  }

  // lists
  const lis = html.querySelectorAll("li");
  for (const li of lis) li.textContent = `[*]${li.textContent}`;
  const uls = html.querySelectorAll("ul");
  for (let ul of uls) ul.textContent = `[list]\n${ul.textContent}[/list]\n`;
  const ols = html.querySelectorAll("ol");
  for (const ol of ols) ol.textContent = `[list=1]\n${ol.textContent}[/list]\n`;

  // scratchblocks
  const scratchBlocksPres = html.getElementsByClassName("blocks");
  for (const pre of scratchBlocksPres) {
    pre.textContent = `[scratchblocks]\n${pre.getAttribute("data-original")}\n[/scratchblocks]`; // cs.js manages data-original because 3.0 scratchblocks
  }

  // code blocks
  const codeBlocks = html.querySelectorAll("div.code");
  for (const codeBlock of codeBlocks) codeBlock.textContent = `[code]\n${codeBlock.textContent}[/code]\n`;

  // quotes
  const quotes = html.querySelectorAll("blockquote");
  for (const quote of quotes) {
    const author = quote.querySelector("p.bb-quote-author");
    const authorText = !author || author?.textContent?.length < 8 ? "" : author.textContent;
    if (author) author.textContent = "";
    quote.insertAdjacentText(
      "afterbegin",
      "[quote" + (authorText ? `=${authorText.slice(0, authorText.length - 7)}]\n` : "]\n")
    );
    quote.insertAdjacentText("beforeend", "[/quote]\n");
  }

  // remove any 'copy code' buttons added by forums-copy-code
  const copyCodeBtns = html.querySelectorAll("div.sa-copyCodeDiv");
  for (const ccbtn of copyCodeBtns) {
    ccbtn.textContent = "";
  }

  return html.textContent;
}

function getTextNodes(element, excludeClasses) {
  let textNodes = [];
  for (const child of element.childNodes) {
    if (child.nodeType === 3) {
      textNodes.push(child);
    } else if (!excludeClasses.some((className) => child.classList.contains(className))) {
      textNodes = textNodes.concat(getTextNodes(child, excludeClasses));
    }
  }
  return textNodes;
}

function setup() {
  if (isSetup) return;
  isSetup = true;
  const originalCopyPaste = window.copy_paste;
  window.copy_paste = async function (id) {
    const post = $("#" + id);
    const username = post.find(".username").text();
    const idText =
      !forumIdAddon?.self?.disabled && forumIdAddon?.settings?.get?.("auto_add")
        ? `[small](${getIDLink(
            id.substring(1),
            post["0"].querySelector(".box-head > .conr").textContent,
            false
          )})[/small]`
        : "";
    const selection = window.getSelection();
    const showBbcode = post.find("[data-show-bbcode]");
    const text =
      showBbcode.length !== 0
        ? selection.toString() === ""
          ? showBbcode[0].innerText
          : selection
        : await getPostText(id, post[0], selection);
    paste(`[quote=${username}]${idText}\n${text}\n[/quote]\n`);
  };
}
