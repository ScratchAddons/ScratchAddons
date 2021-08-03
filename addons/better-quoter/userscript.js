/* global copy_paste */
export default async function ({ addon, global, console }) {
  function getSelectionBBCode() {
    var selection = window.getSelection();
    if (selection.rangeCount > 0) {
      // if something is selected
      let range = selection.getRangeAt(0);
      var clonedSelection = range.cloneContents();
      var html = document.createElement("div");
      html.appendChild(clonedSelection);
    } else {
      // nothing is selected
      return "";
    }

    // new lines
    let lineBreaks = html.querySelectorAll("br");
    for (let br of lineBreaks) br.insertAdjacentText("afterend", "\n");

    // images and smileys
    let smilieReplaces = Object.assign(Object.create(null), {
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
      roll: ":rolleyes",
      cool: ":cool:",
    });

    let imgs = html.querySelectorAll("img");
    for (let img of imgs) {
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
      } else img.parentNode.insertBefore(document.createTextNode(`[img]${img.src}[/img]`), img);
    }

    // bold, italic, underline, strikethrough, big, small and color
    let bbReplaces = {
      italic: "i",
      bold: "b",
      big: "big",
      small: "small",
      underline: "u",
      strikethrough: "s",
    };
    let spans = html.querySelectorAll("span");
    for (let span of spans) {
      if (span.className.startsWith("bb-")) {
        span.insertAdjacentText("afterbegin", `[${bbReplaces[span.className.slice(3)]}]`);
        span.insertAdjacentText("beforeend", `[/${bbReplaces[span.className.slice(3)]}]`);
      } else if (span.style.color) {
        let color = span.style.color;

        function componentToHex(c) {
          var hex = c.toString(16);
          return hex.length === 1 ? "0" + hex : hex;
        }

        function rgbToHex(r, g, b) {
          return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
        }

        if (color.startsWith("rgb")) {
          let rgbValues = color
            .slice(4, color.length - 1)
            .split(/, ?/)
            .map((x) => Number(x));

          span.insertAdjacentText("afterbegin", `[color=${rgbToHex(...rgbValues).toUpperCase()}]`);
        } else span.insertAdjacentText("afterbegin", `[color=${color}]`);
        span.insertAdjacentText("beforeend", "[/color]");
      }
    }

    // links
    // todo: try and gues where dictionary/wiki/wp etc. tags are being used?
    let links = html.querySelectorAll("a");
    for (let link of links) {
      link.insertAdjacentText("afterbegin", `[url=${link.href}]`);
      link.insertAdjacentText("beforeend", "[/url]");
    }

    // center
    let divs = html.querySelectorAll("div");
    for (let div of divs) {
      if (div.style.textAlign === "center") {
        div.insertAdjacentText("afterbegin", "[center]");
        div.insertAdjacentText("beforeend", "[/center]");
      }
    }

    // lists
    let lis = html.querySelectorAll("li");
    for (let li of lis) li.textContent = `[*]${li.textContent}`;
    let uls = html.querySelectorAll("ul");
    for (let ul of uls) ul.textContent = `[list]\n${ul.textContent}[/list]\n`;
    let ols = html.querySelectorAll("ol");
    for (let ol of ols) ol.textContent = `[list=1]\n${ol.textContent}[/list]\n`;

    // scratchblocks
    let scratchBlocksPres = html.getElementsByClassName("blocks");
    for (let pre of scratchBlocksPres) {
      pre.textContent = `[scratchblocks]\n${pre.getAttribute("data-original")}\n[/scratchblocks]`; // cs.js manages data-original because 3.0 scratchblocks
    }

    // code blocks
    let codeBlocks = html.querySelectorAll("div.code");
    for (let codeBlock of codeBlocks) codeBlock.textContent = `[code]\n${codeBlock.textContent}[/code]\n`;

    // quotes
    let quotes = html.querySelectorAll("blockquote");
    for (let quote of quotes) {
      let author = quote.querySelector("p.bb-quote-author");
      if (author)
        quote.textContent = `[quote=${author.textContent.slice(0, author.textContent.length - 7)}]\n${
          quote.textContent
        }[/quote]\n`;
      else quote.textContent = `[quote]\n${quote.textContent}[/quote]\n`;
    }

    return html.textContent;
  }

  let textarea = document.querySelector(".markItUpEditor");
  while (true) {
    let quoteButton = await addon.tab.waitForElement(".postquote a", { markAsSeen: true });
    quoteButton.setAttribute("onclick", "return false");
    quoteButton.addEventListener("mouseup", (e) => {
      let blockpost = quoteButton.closest(".blockpost");
      let selection = window.getSelection();
      let selectionStr = selection.toString();
      if (
        selectionStr &&
        selection.anchorNode &&
        blockpost.contains(selection.anchorNode) &&
        selection.focusNode &&
        blockpost.contains(selection.focusNode)
      )
        textarea.value += `[quote=${
          blockpost.querySelector(".black.username").innerText
        }]${getSelectionBBCode()}[/quote]`;
      else copy_paste(blockpost.id);
      textarea.scrollIntoView(false);
      textarea.focus();
    });
  }
}
