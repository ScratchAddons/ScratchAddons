export default async function ({ addon, console }) {
  
  // create a button and append it
  const button = document.createElement('button');
  button.textContent = 'Bump';
  button.style.float = 'right';
  document.querySelector('.form-submit').append(span);
  
  let textarea = document.querySelector(type === "settings" ? "#id_signature" : "#id_body");
  let postButton = document.querySelector(type === "topic" ? ".button.grey:nth-child(1)" : "button");
  
  // listen to the bump button click
  button.addEventListener("click", async () => {
    textarea.value = addon.settings.get('bumptext');
    postButton.click();
  });
}
