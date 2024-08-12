export default async function ({ addon, console }) {
  addon.self.addEventListener("disabled", () => {
    document.querySelectorAll(".activity-stream, .activity-ul, .postsignature, .project-title.no-edit, .scratchblocks, .blocks3").forEach((el) => {
      el.scrollTop = 0;
      el.scrollLeft = 0;
    });
  });
}
