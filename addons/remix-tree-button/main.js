export default async function ({ addon, global, console }) {
  //define remix tree button elements

  const subactions = document.querySelector(".flex-row.subactions").querySelector(".action-buttons");

  const remixtree = document.createElement("button");

  const remixtreeSpan = document.createElement("span");
  remixtreeSpan.innerText = 'Remix Tree';
  const remixtreeImg = document.createElement("img");
  remixtreeImg.setAttribute('src', "https://scratch.mit.edu/svgs/project/remix-white.svg");
  remixtreeImg.setAttribute('height', '15px');
  remixtree.style.marginRight = '5px'; //no, i will not do this through userstyle, i simply won't.

  remixtree.className = "button action-button remixtree-button";
  remixtree.id = "scratchAddonsRemixTreeBtn";
  remixtree.appendChild(remixtreeImg);
  remixtree.appendChild(remixtreeSpan);
  remixtree.addEventListener('click', () => {
    if (window.location.href.endsWith("/")) window.location.href.split('#')[0] += "remixtree"; // not the best way to get rid of the hash, but...
    else window.location.href.split('#')[0] += "/remixtree"; 
  });
  remixtree.style.display = "flex";
  remixtree.style.alignItems = "center";
  if (addon.settings.get("buttonColor")) {
    remixtree.style.backgroundColor = addon.settings.get("buttonColor");
  }

  subactions.appendChild(remixtree);
}
