let sdsText = document.querySelectorAll('.box-header>h4')[5].textContent;
let sds = '';
let continueloop = false;
for (var i = 0; i < sdsText.length; i++) {
  if (sdsText[i-2] === '-' || continueloop) {
    sds = sds + sdsText[i];
    continueloop = true;
  }
}

export default sds;