export default async function ({ addon, global, console }) {
  if (document.body.contains(document.querySelector('#signature'))) {
    return
  } else {
      if (document.location.href.split("/")[5] == "editor") {
        return
      } else {
          var semicolon = document.createElement("p");
          semicolon.textContent = ";";
          semicolon.classList.add("semicolon");
          document.body.appendChild(semicolon);
}
