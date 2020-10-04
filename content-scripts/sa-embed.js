if (window.parent !== window) window.parent.postMessage("ready", "*");

window.addEventListener("message", (event) => {
  if (event.origin === chrome.runtime.getURL("").slice(0, -1)) {
    event.data.forEach((obj) => localStorage.setItem(obj.key, obj.value));
    event.source.postMessage("OK", "*");
  }
});
