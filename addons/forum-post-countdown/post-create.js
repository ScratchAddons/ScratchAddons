export default async function ({ addon }) {
  const submitButtons = document.querySelectorAll("#djangobbwrap .form-submit [type=submit]");
  const submitButton = submitButtons[submitButtons.length - 1];

  submitButton.addEventListener("click", () => {
    if (!localStorage.getItem("sa-forum-post-countdown")) {
      localStorage.setItem("sa-forum-post-countdown", Date.now());
    }
  });
}
