export default async function ({ addon, global, console }) {
  var semicolon = document.createElement("p");
  semicolon.textContent = ";";
  semicolon.classList.add("semicolon");
  document.body.appendChild(semicolon);
}
