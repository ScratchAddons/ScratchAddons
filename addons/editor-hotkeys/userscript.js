export default async function({ addon, global, console }) {
  function convert(hotkey) {
    return {
      "key": hotkey.slice(-1),
      "shiftKey": hotkey.includes("Shift")
    };
  }
  function click(query, pick=0) {
    let q = document.querySelectorAll(query)[pick]
    if (q) document.querySelectorAll(query)[pick].click()
    return q
  }
  var allSettings = []
  fetch(addon.self.dir + "/addon.json")
  .then((response) => {
    return response.json();
  })
  .then((data) => {
    for (var i = 0; i < data.settings.length; i++) {
      allSettings[i] = data.settings[i].id
    }
  });
  document.addEventListener("keydown", function(e) {
    for (var i = 0; i < allSettings.length; i++) {
      let converted = convert(addon.settings.get(allSettings[i]))
      if (e.shiftKey == converted.shiftKey && e.ctrlKey && e.key == converted.key) {
        e.preventDefault()
        if (i == 0) {
          click('[class^="green-flag_green-flag"]')
        } else if (i == 1) {
          click('[class^="stop-all_stop-all"]')
        } else if (i == 2) {
          if (!click('[class^="community-button_community-button"]')) {
            click('.see-inside-button')
          }
        }
      }
    }
  })
}
