export default async function ({addon, console, msg}) {
  await addon.tab.waitForElement(".postfootright > ul", {
    markAsSeen: true,
  });
  const buttons = document.querySelectorAll('.postfootright');
  buttons.forEach(function (elm) {
    let addBtn = document.createElement('li');
    let addBtnAElement = document.createElement('a');
    addBtnAElement.href = '#reply';
    addBtnAElement.textContent = msg('add-btn');
    addBtn.appendChild(addBtnAElement);
    addBtn.addEventListener('click', addIDLink);
    addon.tab.appendToSharedSpace({space: 'forumsBeforePostReport', element: addBtn, scope: elm});
  });
  function addIDLink(e) {
    let textEditor = document.querySelector('.markItUpEditor');
    let idName = e.path[6].querySelector('.box-head > .conr').textContent;
    let id = e.path[6].id + '';
    id = id.substring(1);
    textEditor.value = `[url=https://scratch.mit.edu/discuss/post/${id}/]${idName}[/url] ` + textEditor.value;
  }
}