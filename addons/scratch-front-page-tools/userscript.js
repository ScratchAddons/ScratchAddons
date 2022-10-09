export default async function ({ addon, global, console, msg }) {
  DeleteRows();
  AddRows();
  Load();

  function Load() {
    let rowDataRaw =
      "{" +
      '"0" : "1",' +
      '"1" : "1",' +
      '"2" : "1",' +
      '"3" : "1",' +
      '"4" : "1",' +
      '"5" : "1",' +
      '"6" : "1",' +
      '"7" : "1",' +
      '"8" : "1"' +
      "}";

    if (!localStorage.getItem("rowData")) {
      localStorage.setItem("rowData", rowDataRaw);
    }

    let rowData = JSON.parse(localStorage.getItem("rowData"));
    let rows = document.querySelectorAll(".box");

    for (let i = 0; i < rows.length; i++) {
      if (rowData[i] === "1") {
        rows[i].style.display = "inline-block";
      } else {
        rows[i].style.display = "none";
      }
    }
  }

  function DeleteRows() {
    const allBoxHeaders = document.querySelectorAll(".box>.box-header>p").length;

    for (let i = 0; i < allBoxHeaders; i++) {
      let available = document.querySelectorAll(".box-header>p>.sa-del-button")[Number(i)];
      if (available === undefined) {
        let delButton = document.createElement("button");
        delButton.className = "sa-del-button";
        document.querySelectorAll(".box>.box-header>p")[Number(i)].appendChild(delButton);

        const delImg = document.createElement("img");
        delImg.src = "https://scratch.mit.edu/static/assets/a5787bb7364d8131ed49a8f53037d7f4.svg";
        delButton.appendChild(delImg);
      }
    }

    let delBTN = document.querySelectorAll(".sa-del-button");
    delBTN.forEach((el) =>
      el.addEventListener("click", () => {
        let parent = el.parentNode;
        let boxHeader = parent.parentNode;
        let box = boxHeader.parentNode;
        let boxHeaders = document.querySelectorAll(".box-header");

        for (let i = 0; i < boxHeaders.length; i++) {
          if (boxHeaders[i].textContent === boxHeader.textContent) {
            let num = i;
            box.style.display = "none";
            let rowData = JSON.parse(localStorage.getItem("rowData"));
            rowData[num] = "0";
            let rowDataRaw = JSON.stringify(rowData);
            localStorage.setItem("rowData", rowDataRaw);
            break;
          }
        }
      })
    );
  }

  function AddRows() {
    let splash = document.querySelectorAll(".splash")[0];
    let firstSibling = document.querySelectorAll(".splash>.mod-splash")[0];
    let addBTN = document.createElement("button");
    addBTN.className = "button sa-add-button";
    splash.insertBefore(addBTN, firstSibling);

    let addSpan = document.createElement("span");
    addSpan.textContent = "+";
    addBTN.appendChild(addSpan);

    let optionDiv = document.createElement("div");
    optionDiv.className = "sa-option-div";
    optionDiv.style.display = "none";
    splash.insertBefore(optionDiv, firstSibling);

    let form = document.createElement("form");
    optionDiv.appendChild(form);

    let optionsSelect = document.createElement('select');
    optionsSelect.className = 'sa-options-select';
    form.appendChild(optionsSelect);

    let rows = document.querySelectorAll(".box-header>h4");
    for (let i = 0; i < rows.length; i++) {
      let option = document.createElement('option');
      option.textContent = rows[i].textContent;
      optionsSelect.appendChild(option);
    }

    let addRowBTN = document.createElement('button');
    addRowBTN.className = 'sa-add-row-button button';
    optionDiv.appendChild(addRowBTN);

    let addRowSpan = document.createElement('span');
    addRowSpan.textContent = msg('addRow');
    addRowBTN.appendChild(addRowSpan);

    addBTN.addEventListener('click', () => {
      let value = optionsSelect.value;
      for (let i = 0; i < rows.length; i++) {
        if (rows[i].textContent === value) {
          if (rows[i].parentNode.parentNode.style.display !== 'none') {
            addRowBTN.disabled = 'true';
          } else {
            addRowBTN.removeAttribute('disabled');
          }
        }
      }
      if (optionDiv.style.display === 'none') {
        optionDiv.style.display = 'inline-block';
      } else {
        optionDiv.style.display = 'none';
      }
    });

    optionsSelect.addEventListener('change', (event) => {
      let value = event.target.value;
      for (let i = 0; i < rows.length; i++) {
        if (rows[i].textContent === value) {
          if (rows[i].parentNode.parentNode.style.display !== 'none') {
            addRowBTN.disabled = 'true';
          } else {
            addRowBTN.removeAttribute('disabled');
          }
        }
      }
    });

    addRowBTN.addEventListener('click', () => {
      let row = optionsSelect.value;

      for (let i = 0; i < rows.length; i++) {
        if (rows[i].textContent === row) {
          let rowData = JSON.parse(localStorage.getItem("rowData"));
          rowData[i] = '1';
          rows[i].parentNode.parentNode.style.display = 'inline-block';
          localStorage.setItem("rowData", JSON.stringify(rowData));
          addRowBTN.disabled = 'true';
          break;
        }
      }
    });
  }
}
