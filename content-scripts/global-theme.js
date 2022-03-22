

chrome.storage.sync.get(["globalTheme"], function() {
  var tickTimeCheck = setInterval(function() {
    //if (result.globalTheme !== "time") { return };
    getTime();
  }, 1000);
  getTime();
});

// true = inside, false = outside, nothing - 
function getTime() {
  // Add chrome messages and if about turning off and on addons...
  //Nie działa odbieranie danych powyżej!
  chrome.storage.sync.get(['timeOne', 'timeTwo', 'themeTimeStatus'], function(r) {
    let timeOneSplit = r.timeTwo.split(":");
    const timeOne = parseInt((timeOneSplit[0] * 60)) + parseInt(timeOneSplit[1])
    let timeTwoSplit = r.timeOne.split(":");
    const timeTwo = parseInt((timeTwoSplit[0] * 60)) + parseInt(timeTwoSplit[1])
    let date = new Date();
    let currentTime = (date.getHours() * 60) + date.getMinutes();
    var timeStatus = (timeOne <= currentTime || currentTime <= timeTwo);
    var el = r.themeTimeStatus;
    console.log(el + "asd" + timeStatus);
    if ( el != timeStatus ) {
      console.log("secod");
      chrome.storage.sync.set({'themeTimeStatus': timeStatus});
      chrome.runtime.sendMessage({ changeEnabledState: { addonId: "dark-www", newState: timeStatus } });
      chrome.runtime.sendMessage({ changeEnabledState: { addonId: "editor-dark-mode", newState: timeStatus } });
    };
  });
};
        
function updateTheme(mode) {
  if (mode === true) {
    lightThemeLink.removeAttribute("media");
  } else {
    lightThemeLink.media = "not all";
  }
}
