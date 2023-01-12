export default async function ({ addon, console, msg }) {
  addon.self.addEventListener("disabled", function() {
   document.querySelector(".project-title.no-edit")?.scrollLeft = 0
  });
}
