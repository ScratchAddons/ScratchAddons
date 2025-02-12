import { setupMarkdownForums } from "../better-quoter/module.js";
import { createButton, createDropdown } from "../forum-toolbar/lib.js";
import { toBBCode } from "./markdownToBbcode.js";

export default async function ({ addon, msg, console }) {
  const body = document.querySelector(".markItUpEditor");
  const submitButton = document.querySelector(".form-submit button");

  body.addEventListener("input", () => {
    // TODO: Remove this
    console.log(toBBCode(body.value));
  });

  submitButton.addEventListener("click", (e) => {
    if (addon.self.disabled) {
      return;
    }
    const bbcode = toBBCode(body.value);
    if (!bbcode.success) {
      e.preventDefault();
      alert(msg(bbcode.message.split("\n")[0]));
      return;
    }
    body.value = bbcode.bbcode;
  });

  const replace = (query, button) => {
    const element = document.querySelector(query);
    button.classList.add(...element.classList);
    element.classList.add("sa-markdown-forums-original");
    element.insertAdjacentElement("afterend", button);
    addon.tab.displayNoneWhileDisabled(button);
  };

  await addon.tab.waitForElement(".markItUpButton16");

  replace(
    ".markItUpButton1",
    createButton("bold", {
      openWith: "**",
      closeWith: "**",
      nameMessage: "Bold [Ctrl+B]",
      classPrefix: "sa-markdown-forums-",
    })
  );
  replace(
    ".markItUpButton2",
    createButton("italic", {
      openWith: "_",
      closeWith: "_",
      nameMessage: "Italic [Ctrl+I]",
      classPrefix: "sa-markdown-forums-",
    })
  );
  document.querySelector(".markItUpButton3").classList.add("sa-markdown-forums-original");
  replace(
    ".markItUpButton4",
    createButton("stroke", {
      openWith: "~~",
      closeWith: "~~",
      nameMessage: "Stroke [Ctrl+S]",
      classPrefix: "sa-markdown-forums-",
    })
  );
  replace(
    ".markItUpButton5",
    createButton("picture", {
      openWith: "![](",
      closeWith: ")",
      promptText: true,
      promptMessage: "Url",
      nameMessage: "Picture [Ctrl+P]",
      classPrefix: "sa-markdown-forums-",
    })
  );
  replace(
    ".markItUpButton6",
    createButton("link", {
      openWith: "[](",
      closeWith: ")",
      promptText: true,
      promptMessage: "Url",
      nameMessage: "Link [Ctrl+L]",
      classPrefix: "sa-markdown-forums-",
    })
  );
  replace(
    ".markItUpButton7",
    createDropdown(
      "heading",
      "Heading [Ctrl+S]",
      Array(6)
        .fill()
        .map((_, i) => {
          const level = i + 1;
          return createButton(`h${level}`, {
            openWith: `${"#".repeat(level)} `,
            closeWith: "\n",
            msg,
            classPrefix: "sa-markdown-forums-",
          });
        }),
      null,
      "sa-markdown-forums-"
    )
  );
  replace(
    ".markItUpButton8",
    createButton("bulleted-list", {
      openWith: "- ",
      closeWith: "",
      nameMessage: "Bulleted List",
      classPrefix: "sa-markdown-forums-",
    })
  );
  replace(
    ".markItUpButton9",
    createButton("numeric-list", {
      openWith: "1. ",
      closeWith: "",
      nameMessage: "Numeric List",
      classPrefix: "sa-markdown-forums-",
    })
  );
  document.querySelector(".markItUpButton10").classList.add("sa-markdown-forums-original");
  replace(
    ".markItUpButton11",
    createButton("quotes", {
      openWith: "> ",
      closeWith: "",
      nameMessage: "Quotes",
      classPrefix: "sa-markdown-forums-",
    })
  );
  document.querySelector(".markItUpButton15").classList.add("sa-markdown-forums-original");

  setupMarkdownForums(addon);
}
