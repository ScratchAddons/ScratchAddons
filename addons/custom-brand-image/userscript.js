export default async function ({ addon, global, console }) {
  function update() {
    var logos = document.querySelectorAll("#navigation .logo a")
    for (let i = 0; i < logos.length; i++) {
      if (addon.settings.get("showbrand") == true) {
        logos[i].style.backgroundImage = `url(${addon.settings.get("imageurl")})`
      } else {
      	logos[i].remove()
      }
    }
  }
  document.body.addEventListener("load", update);
  addon.settings.addEventListener("change", update);
  update()
}