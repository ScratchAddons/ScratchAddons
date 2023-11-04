import { marked } from "../../libraries/thirdparty/cs/marked.esm.js";
import { options } from "./markdownToBbcode.js";

export default async function ({ msg, console }) {
  const body = document.querySelector("#id_body");
  const submitButton = document.querySelector(".form-submit button");
  submitButton.addEventListener("click", (e) => {
    let bbcode;
    try {
      bbcode = marked.parse(body.value, options);
    } catch (error) {
      e.preventDefault();
      alert(msg(error.message.split("\n")[0]));
      return;
    }
    body.value = bbcode;
  });
}
