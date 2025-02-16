export default async function ({ addon, msg, console }) {
  new BroadcastChannel("sa-live-read-topics").addEventListener("message", (e) => {
    const el = document.querySelector(`.tclcon a[href='/discuss/topic/${e.data}/']`);
    if (!el) return;
    el.parentElement.classList.add("topic_isread");
    const tcl = el.closest(".tcl");
    const icon = tcl.querySelector(".inew, .iclosed");
    if (icon) {
      icon.classList.remove("inew", "iclosed");
      icon.classList.add("forumicon");
    }
    const newPostsLink = tcl.querySelector(".tclcon > a");
    newPostsLink.classList.add("sa-live-read-topics-new-posts");
    newPostsLink.removeAttribute("href");
  });
}
