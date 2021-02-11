export default async function ({
  addon,
  global,
  console
}) {
  if (!addon.tab.clientVersion) return;
  await addon.tab.waitForElement("div.blockpost", {
    markAsSeen: true
  });
  document.querySelectorAll('div.blockpost').forEach((elem) => {
    let newElem = document.createElement('a');
    newElem.setAttribute('nohref', '');
    /*
    {
      "url": "forum.js",
      "matches": ["https://scratch.mit.edu/discuss/topic/*"],
      "runAtComplete": false
    }
    */
    newElem.textContent = ' Copy Link';
    newElem.setAttribute('onclick', `
      console.info(this.parentElement.parentElement.parentElement.parentElement.parentElement.firstElementChild.name);
      // \`\${location.href.split('#')[0]}#\${this.parentElement.parentElement.parentElement.parentElement.parentElement.firstElementChild.name}\`;
      navigator.clipboard.writeText('s');
      `);
    window.onload = () => {
      console.log(elem.querySelector(`div.box > div.box-content > div.postfootright > ul`));
    }
    let newSpan = document.createElement('span');
    newSpan.textContent = '|';
    elem.querySelector(`div.box > div.box-content > div.postfootright > ul`).appendChild(newSpan);
    elem.querySelector(`div.box > div.box-content > div.postfootright > ul`).appendChild(newElem);
  });
}