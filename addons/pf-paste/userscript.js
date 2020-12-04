export default async function ({ addon, global, console }) {
  let button = document.createElement("button");
  button.innerText="Greet";
  let input = document.querySelector("textarea[name='content']");
  document.querySelector(".control-group").appendChild(button);
  button.addEventListener("click", function() {
        let word = "Hi, I am " + Scratch.INIT_DATA.LOGGED_IN_USER.model.username
        input.value = word;
  });
}
