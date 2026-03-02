export default async function ({ addon, console }) {
  function resetScroll() {
    document
      .querySelectorAll(
        ".activity-stream, .activity-ul, .postsignature, .project-title.no-edit, .scratchblocks, .blocks3"
      )
      .forEach((el) => {
        el.scrollTop = 0;
        el.scrollLeft = 0;
      });
  }

  addon.self.addEventListener("disabled", resetScroll);
  addon.settings.addEventListener("change", resetScroll);
}
