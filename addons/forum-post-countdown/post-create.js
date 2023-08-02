export default async function () {
  const submitButton = document.querySelector("#djangobbwrap .form-submit [type=submit]");

  submitButton.addEventListener("click", () => {
    if (!localStorage.getItem("sa-forum-post-countdown")) {
      localStorage.setItem("sa-forum-post-countdown", Date.now());
    }
  });
}
