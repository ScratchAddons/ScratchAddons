import { setupMarkdownForums } from "../better-quoter/module.js";
import { toBBCode } from "./markdownToBbcode.js";

export default async function ({ addon, msg, console }) {
  const body = document.querySelector("#id_body");
  const submitButton = document.querySelector(".form-submit button");

  body.addEventListener("input", () => {
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

  setupMarkdownForums(addon);
}
