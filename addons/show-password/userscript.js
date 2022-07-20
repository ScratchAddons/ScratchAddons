export default async function ({ addon, global, console, msg }) {

  if(document.location.href == 'https://scratch.mit.edu/join')
    return false;

  window.addEventListener('resize', moveButtons);

  if(document.querySelector('.dropdown')){
    let observer = new MutationObserver(function(mutations){
      mutations.forEach(function(mutation) {
        if (mutation.type === "attributes") {
          moveButtons();
        }
      });
    });
    observer.observe(document.querySelector('.dropdown'),{
      attributes: true
    });
  }

  if(document.location.href.includes('users')){
    let observer2 = new MutationObserver(function(mutations){
      mutations.forEach(function(mutation) {
        if (mutation.type === "attributes") {
          moveButtons();
        }
      });
    });
    observer2.observe(document.querySelector('.modal'),{
      attributes: true
    });
  }

  function moveButtons(){
    document.querySelectorAll('.sa-show-password-button').forEach(function(button){
      if(button.getAttribute('for')){
        let input = document.getElementById(button.getAttribute('for'));
        let rect = input.getBoundingClientRect();
        let rect2 = input.parentNode.getBoundingClientRect();
        button.style.right = (rect2.right-rect.right+7) + 'px';
        button.style.top = ((rect.top-rect2.top)+((rect.bottom-rect.top)/2-25/2)) + 'px';
      }
    });
  }

  function showPassword(){
    let input = document.getElementById(this.getAttribute('for'));
    if(input.type == 'password'){
      input.type = 'text';
      this.className = 'sa-show-password-button barred';
      this.setAttribute('title', msg('hide'));
    }else{
      input.type = 'password';
      this.className = 'sa-show-password-button';
      this.setAttribute('title', msg('show'));
    }
  }

  let inputNumber = 0;
  while(true){
    const input = await addon.tab.waitForElement('input[type="password"]', {
      markAsSeen: true,
    });
    if(!input.id)
      input.id = 'sa-password-' + inputNumber++;
    let button = document.createElement('label');
    button.className = 'sa-show-password-button';
    button.setAttribute('for', input.id);
    button.setAttribute('title', msg('show'));
    button.style.display = 'block';
    input.parentNode.appendChild(button);
    input.parentNode.style.position = 'relative';
    let rect = input.getBoundingClientRect();
    let rect2 = input.parentNode.getBoundingClientRect();
    button.style.right = (rect2.right-rect.right+7) + 'px';
    button.style.top = ((rect.top-rect2.top)+((rect.bottom-rect.top)/2-25/2)) + 'px';
    button.onclick = showPassword;
  }

}