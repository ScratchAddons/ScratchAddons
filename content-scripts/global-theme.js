chrome.storage.sync.get(["globalTheme"], function (r) {
  var tickTimeCheck = setInterval(function () {
    if (r.globalTheme !== "time") {
      return;
    }
    getTime();
  }, 1000);
  getTime();
});

// true = inside, false = outside, nothing -
function getTime() {
  chrome.storage.sync.get(["timeOne", "timeTwo", "themeTimeStatus"], function (r) {
    let timeOneSplit = r.timeTwo.split(":");
    const timeOne = parseInt(timeOneSplit[0] * 60) + parseInt(timeOneSplit[1]);
    let timeTwoSplit = r.timeOne.split(":");
    const timeTwo = parseInt(timeTwoSplit[0] * 60) + parseInt(timeTwoSplit[1]);
    let date = new Date();
    let currentTime = date.getHours() * 60 + date.getMinutes();
    var timeStatus = timeOne <= currentTime || currentTime <= timeTwo;
    var el = r.themeTimeStatus;
    if (el != timeStatus) {
      chrome.storage.sync.set({ themeTimeStatus: timeStatus });
      chrome.runtime.sendMessage({ changeEnabledState: { addonId: "dark-www", newState: timeStatus } });
      chrome.runtime.sendMessage({ changeEnabledState: { addonId: "editor-dark-mode", newState: timeStatus } });
    }
  });
}
