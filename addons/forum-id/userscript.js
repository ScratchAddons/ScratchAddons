export default async function ({addon, console, msg}) {
  await addon.tab.waitForElement(".postfootright > ul", {
    markAsSeen: true,
  });
  const buttons = document.querySelectorAll('.postfootright');
  buttons.forEach(function (elm) {
    let lineNode = document.createTextNode('| ');
    let addBtn = document.createElement('li');
    elm.querySelector('.postreport').prepend(lineNode);
    addBtn.innerHTML = `<a href="#reply">${msg('add-btn')}</a>`;
    addBtn.addEventListener('click', addIDLink);
    elm.querySelector('ul').prepend(addBtn);
  });
  function addIDLink(e) {
    let textEditor = document.querySelector('.markItUpEditor');
    let idName = e.path[6].querySelector('.box-head > .conr').textContent;
    let id = e.path[6].id + '';
    id = id.substring(1);
    textEditor.textContent = `[url=https://scratch.mit.edu/discuss/post/${id}/]${idName}[/url] ` + textEditor.textContent;
  }
}