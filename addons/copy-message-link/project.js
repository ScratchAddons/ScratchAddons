export default async function ({
  addon,
  global,
  console
}) {
  await addon.tab.waitForElement("div.comment", {
    markAsSeen: true
  });
  setInterval(() => {
    document.querySelectorAll('div[id^=comments-]').forEach((elem) => {
      if (!elem.querySelector(`div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > span:nth-child(1) > span:nth-child(1) > span`)) {
        let newElem = document.createElement('span');
        newElem.textContent = ' Copy Link';
        newElem.style = 'cursor: pointer;';
        elem.querySelector(`div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > span:nth-child(1) > span:nth-child(1)`).appendChild(newElem);
        newElem.onclick = (e) => {
          // console.info(e.target.offsetParent.parentElement.parentElement.id);
          let newElem2 = document.createElement('textarea');
          newElem2.value = `${location.href.split('#')[0]}#${e.target.offsetParent.parentElement.parentElement.id}`;
          document.body.appendChild(newElem2);
          newElem2.select();
          document.execCommand('copy');
          document.body.removeChild(newElem2);
          e.target.textContent = ' Copied!';
          setTimeout(() => {
            e.target.textContent = ' Copy Link';
          }, 1500);
        }
        // newElem.setAttribute('onclick', `navigator.clipboard.writeText(\`\${location.href.split('#')[0]}#\${this.parentElement.parentElement.parentElement.parentElement.id}\`);`);
      }
    });
  }, 1000);
}