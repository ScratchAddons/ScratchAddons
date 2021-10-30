export default async function ({ addon, global, console }) {
  if (addon.tab.clientVersion == "scratchr2") {
    let box = document.getElementsByClassName("status-code")[0];
/*     console.log(box) */
    runBox(box);
  } else {
    let box = document.getElementsByClassName("flex-row inner")[0];
/*     console.log(box) */
    runBox(box);
  }

  function runBox(box) {
    // this code will just error out if there is not a 404 and should not cause any problems
    if (addon.settings.get("redirect") === true && typeof box != "undefined") {
        window.location.href = calculateTip();
        return;
    }
    if (typeof box == "undefined") {
        return;
    }
    let smartbox = document.createElement("div");
    smartbox.className = "sa-smart-error";
    smartbox.title = "Message from Scratch Addons."
    let span = document.createElement("span");
    span.innerText = "We think that you might be trying to find this: ";
    span.style = "display: inline;"
    smartbox.append(span);
    let link = document.createElement("a");
    const showTip = calculateTip();
    link.href = showTip;
    link.innerText = " " + showTip;
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
