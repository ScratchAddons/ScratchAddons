export default async function ({
  addon,
  global,
  console
}) {
  document.querySelectorAll('div.comment').forEach((elem) => {
    let newElem = document.createElement('span');
    newElem.setAttribute('nohref', '');
    newElem.className = 'actions report';
    newElem.textContent = 'Copy link';
    newElem.setAttribute('onclick', `
  function() {
    let newElem2 = document.createElement('textarea');
    newElem2.value = \`\${location.href.split('#')[0]}#\${elem.parentElement.parentElement.id}\`;
    document.body.appendChild(newElem2);
    newElem2.select();
    document.execCommand('copy');
    document.body.removeChild(newElem2);
    delete newElem2;
  }`);
    newElem.setAttribute('nohref', 'nohref');
    document.querySelector(`div#${elem.id} > div.actions-wrap`).appendChild(newElem);
  });
}