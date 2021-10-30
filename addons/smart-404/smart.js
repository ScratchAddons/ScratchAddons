export default async function ({ addon, global, console }) {
  if (addon.tab.clientVersion == "scratchr2") {
    let box = document.getElementsByClassName("box-content")[0];
    runBox(box);
  } else {
    let box = document.getElementsByClassName("flex-row inner")[0];
    runBox(box);
  }

  function runBox(box) {
    // this code will just error out if there is not a 404 and should not cause any problems
    let smartbox = document.createElement("div");
    smartbox.className = "sa-smart-error";
    let p = document.createElement("p");
    p.innerText = "We think that you might be trying to find this: ";
    p.style = "float: left;"
    smartbox.append(p);
    let link = document.createElement("a");
    const showTip = calculateTip();
    link.href = showTip;
    link.innerText = " " + showTip;
    link.style = "float: right;"
    smartbox.append(link);
    box.prepend(smartbox);
  }
  function calculateTip() {
    let tip = "https://scratch.mit.edu";
    const url = location.pathname;
    if (url.endsWith("%29")) {
      tip = "https://scratch.mit.edu" + url.substr(0, url.length - 3);
    }
    if (url.endsWith(")")) {
        tip = "https://scratch.mit.edu" + url.substr(0, url.length - 1);
      }
    if (url.endsWith("//")) {
        const spliturl = url.toString().split("");
        const reversedarray = spliturl.reverse();
        const reversedURL = reversedarray.join('');
        for (let index = 0; index < reversedURL.length; index++) {
            if (reversedURL[index] == "/") {
                continue;
            } else {
                tip = "https://scratch.mit.edu" + url.substr(0, url.length - index);
                break;
            }
        }
    }
    if (location.pathname == "/projects" || location.pathname == "/projects/") {
        tip = "https://scratch.mit.edu/explore";
    }
    return tip;
  }
}
