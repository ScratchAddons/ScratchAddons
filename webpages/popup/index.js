document.getElementById("settings").onclick = () => {
    chrome.runtime.openOptionsPage();
    setTimeout(() => window.close(), 100);
};
document.getElementById("popout").onclick = () => setTimeout(() => window.close(), 100);