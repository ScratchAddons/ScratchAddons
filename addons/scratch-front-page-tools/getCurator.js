let curatorText = document.querySelectorAll(".box-header>h4")[4].textContent;
let curator = "";
let continueloop = false;
for (var i = 0; i < curatorText.length; i++) {
  if (curatorText[i - 2] === "y" || continueloop) {
    curator = curator + curatorText[i];
    continueloop = true;
  }
}

export default curator;
