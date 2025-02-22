export default async function ({ addon, console, msg }) {
  const subscribeCheckbox = document.querySelector("#id_subscribe");
  if (subscribeCheckbox && !subscribeCheckbox.checked) {
    subscribeCheckbox.checked = true;
  }
}
