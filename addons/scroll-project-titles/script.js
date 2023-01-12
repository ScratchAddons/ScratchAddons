export default async function ({ addon, console, msg }) {
  addon.self.addEventListener("disabled", function() {
    if (document.querySelector(".project-title.no-edit")) {
      document.querySelector(".project-title.no-edit").scrollLeft = 0
    }
  });
}
