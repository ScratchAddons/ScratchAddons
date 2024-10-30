import { onSuccessfulPost } from "./module.js";

export default async function ({ addon, console, msg }) {
  onSuccessfulPost(() => {
    const followBtn = document.querySelectorAll(".follow-button")[1];
    followBtn.focus();
    followBtn.click();
  });
}
