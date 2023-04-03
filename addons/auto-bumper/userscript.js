export default async function ({ addon, console }) {
  
  // create a button and append it
  const button = document.createElement('button');
  button.style.float = 'right';
  button.classList.add('grey');
  button.classList.add('button');
  document.querySelector('.form-submit').append(button);
  
  // add the button content
  const span = document.createElement('span');
  span.textContent = 'Bump';
  button.append(span);
  
  let textarea = document.querySelector('.markItUpEditor');
  let postButton = document.querySelector('.form-submit').firstElementChild;
  
  // listen to the bump button click
  button.addEventListener("click", async () => {
    if (!confirm('Are you sure you would like to bump this topic?')) return;
    textarea.value = addon.settings.get('bumptext');
    postButton.click();
  });
}
