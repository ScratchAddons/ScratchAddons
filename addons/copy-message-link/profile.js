export default async function ({
  addon,
  global,
  console
}) {
  await addon.tab.waitForElement("div.comment", {
    markAsSeen: true
  });
  if (addon.settings.get('preferred') === 'reply') {
    document.querySelectorAll('div.comment').forEach((elem) => {
      let newElem = document.createElement('a');
      newElem.className = 'reply';
      newElem.textContent = 'Copy Link';
      newElem.onclick = (e) => {
        let newElem2 = document.createElement('textarea');
        newElem2.value = `${location.href.split('#')[0]}#${e.target.parentElement.parentElement.parentElement.id}`;
        document.body.appendChild(newElem2);
        newElem2.select();
        document.execCommand('copy');
        document.body.removeChild(newElem2);
      }
      newElem.setAttribute('nohref', 'nohref');
      document.querySelector(`div#${elem.id} > div.info > div:nth-child(3)`).appendChild(newElem);
    });
  } else if (addon.settings.get('preferred') === 'report') {
    document.querySelectorAll('div.comment').forEach((elem) => {
      let newElem = document.createElement('span');
      newElem.setAttribute('nohref', '');
      newElem.className = 'actions report';
      newElem.style = 'cursor: pointer;';
      newElem.textContent = 'Copy link';
      newElem.onclick = (e) => {
        let newElem2 = document.createElement('textarea');
        newElem2.value = `${location.href.split('#')[0]}#${e.target.parentElement.parentElement.id}`;
        document.body.appendChild(newElem2);
        newElem2.select();
        document.execCommand('copy');
        document.body.removeChild(newElem2);
      }
      newElem.setAttribute('nohref', 'nohref');
      document.querySelector(`div#${elem.id} > div.actions-wrap`).appendChild(newElem);
    });
  }
}