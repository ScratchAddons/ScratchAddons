export default async function ({ addon, msg, console }) {
  new BroadcastChannel("sa-live-read-topics").addEventListener("message", (e) => {
    const el = document.querySelector(`.tclcon a[href='/discuss/topic/${e.data}/']`);
    if (!el) return;
    el.parentElement.classList.add("topic_isread");
    const icon = el.parentElement.parentElement.parentElement.querySelector(".inew");
    if (!icon) return;
    icon.classList.remove("inew");
    icon.classList.add("forumicon");
  });
}
