import curator from './getCurator.js';
import sds from './getSDS.js';

export default async function ({ addon, global, console }) {
  Load();
  DeleteRows();
  AddRows();

  function Load() {
    let rowDataRaw = '{'+
      '"0" : "1",' +
      '"1" : "1",' +
      '"2" : "1",' +
      '"3" : "1",' +
      '"4" : "1",' +
      '"5" : "1",' +
      '"6" : "1",' +
      '"7" : "1",' +
      '"8" : "1"' +
    '}';
    
    if (!localStorage.getItem('rowData')) {
      localStorage.setItem('rowData', rowDataRaw);
    }

    let rowData = JSON.parse(localStorage.getItem('rowData'));
    let rows = document.querySelectorAll('.box');

    for (var i = 0; i < rows.length; i++) {
      if (rowData[i] === '1') {
        rows[i].style.display = 'inline-block';
      } else {
        rows[i].style.display = 'none';
      }
    }
  }

  function DeleteRows() {
    const allBoxHeaders = document.querySelectorAll('.box>.box-header>p').length;

    for (var i = 0; i < allBoxHeaders; i++) {
      let delButton = document.createElement('button');
      delButton.className = 'sa-del-button';
      document.querySelectorAll('.box>.box-header>p')[Number(i)].appendChild(delButton);

      const delImg = document.createElement('img');
      delImg.src = 'https://scratch.mit.edu/static/assets/a5787bb7364d8131ed49a8f53037d7f4.svg';
      delButton.appendChild(delImg);
    }

    var delBTN = document.querySelectorAll('.sa-del-button')
    delBTN.forEach(el => el.addEventListener('click', () => {
      let parent = el.parentNode;
      let boxHeader = parent.parentNode;
      let box = boxHeader.parentNode;
      let boxHeaders = document.querySelectorAll('.box-header');

      for (var i = 0; i < boxHeaders.length; i++) {
        if (boxHeaders[i].textContent === boxHeader.textContent) {
          let num = i;
          box.style.display = 'none';
          let rowData = JSON.parse(localStorage.getItem('rowData'));
          rowData[num] = '0';
          let rowDataRaw = JSON.stringify(rowData);
          localStorage.setItem('rowData', rowDataRaw);
          break;
        }
      }
    }));
  }

  function AddRows() {
    var splash = document.querySelectorAll('.splash')[0];
    var firstSibling = document.querySelectorAll('.splash>.mod-splash')[0];

    let addBTN = document.createElement('button');
    addBTN.className = 'button sa-add-button';
    splash.insertBefore(addBTN, firstSibling);

    let addSpan = document.createElement('span');
    addSpan.textContent = '+';
    addBTN.appendChild(addSpan);
  }
}