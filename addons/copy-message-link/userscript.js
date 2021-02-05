export default async function ({
  addon,
  global,
  console
}) {
  if (!addon.tab.clientVersion) return;
  await addon.tab.waitForElement("div.comment", {
    markAsSeen: true
  });
  if (addon.settings.get('reply')) {
    document.querySelectorAll('div.comment').forEach((elem) => {
      let newElem = document.createElement('a');
      newElem.setAttribute('nohref', '');
      newElem.className = 'reply';
      newElem.textContent = 'Copy Link';
      newElem.setAttribute('onclick', `
        let newElem2 = document.createElement('textarea');
        newElem2.value = \`\${location.href.split('#')[0]}#\${this.parentElement.parentElement.parentElement.id}\`;
        document.body.appendChild(newElem2);
        newElem2.select();
        document.execCommand('copy');
        document.body.removeChild(newElem2);
        delete newElem2;
        `);
      newElem.setAttribute('nohref', 'nohref');
      document.querySelector(`div#${elem.id} > div.info > div:nth-child(3)`).appendChild(newElem);
    });
  }
  if (addon.settings.get('report')) {
    document.querySelectorAll('div.comment').forEach((elem) => {
      let newElem = document.createElement('span');
      newElem.setAttribute('nohref', '');
      newElem.className = 'actions report';
      newElem.textContent = 'Copy link';
      newElem.setAttribute('onclick', `
      let newElem2 = document.createElement('textarea');
      newElem2.value = \`\${location.href.split('#')[0]}#\${elem.parentElement.parentElement.id}\`;
      document.body.appendChild(newElem2);
      newElem2.select();
      document.execCommand('copy');
      document.body.removeChild(newElem2);
      delete newElem2;
      `);
      newElem.setAttribute('nohref', 'nohref');
      document.querySelector(`div#${elem.id} > div.actions-wrap`).appendChild(newElem);
    });
  }
}