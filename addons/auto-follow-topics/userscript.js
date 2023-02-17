export default async function ({ addon, console, msg }) {
  document.querySelector("[name=AddPostForm]").addEventListener("click", (event) => {
    localStorage.setItem(location.href.split("/")[5], true);
  });

  if (localStorage.getItem(location.href.split("/")[5])) {
    console.log("Following topic");
    const followBtn = document.querySelectorAll(".follow-button")[1];
    followBtn.focus();
    followBtn.click();
    localStorage.clear();
  }
}
