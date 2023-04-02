export default async function ({ addon, console }) {
  
  // create a button and append it
  const button = document.createElement('button');
  button.textContent = 'Bump';
  button.style.float = 'right';
  document.querySelector('.form-submit').append(button);
  
  let textarea = document.querySelector('.markItUpEditor');
  let postButton = document.querySelector('.form-submit').firstElementChild;
  
  // listen to the bump button click
  button.addEventListener("click", async () => {
    textarea.value = addon.settings.get('bumptext');
    postButton.click();
  });
}
