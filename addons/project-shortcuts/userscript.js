export default async function ({ addon, global, console }) {
  var green_flag = addon.settings.get("greenflag").toLowerCase()
  var pause_key = addon.settings.get("pause").toLowerCase()
  var stop = addon.settings.get("stop").toLowerCase()
  console.log("Player controls", green_flag, pause_key, stop)
  addon.settings.update()
  
  document.addEventListener(
    'keydown', 
    function (e) {
      
      let pause = getComputedStyle(document.documentElement).getPropertyValue('--pause-_displayNoneWhileDisabledValue');
      let ctrlKey = e.ctrlKey || e.metaKey;
      if (ctrlKey && [green_flag, pause_key, stop] != [addon.settings.get("greenflag").toLowerCase(), addon.settings.get("pause").toLowerCase(), addon.settings.get("stop").toLowerCase()]) {
        green_flag = addon.settings.get("greenflag").toLowerCase()
        pause_key = addon.settings.get("pause").toLowerCase()
        stop = addon.settings.get("stop").toLowerCase()
        console.log("Player controls", green_flag, pause_key, stop)
      }
      if (ctrlKey && [green_flag, pause_key, stop].includes(e.key)) {
        console.log(e.key)
        e.preventDefault()
      } else {
        return
      }

      let key = e.key.toLowerCase()
  
      if (ctrlKey && key == pause_key) {
        e.preventDefault()
        //  console.log('pause')
        if (!pause) {
          document.getElementsByClassName('pause-btn')[0].click();
        }
      } else if (ctrlKey && key == green_flag) {
        e.preventDefault()
        // console.log('green flag')
        document.getElementsByClassName('green-flag_green-flag_1kiAo')[0].click();
      } else if (ctrlKey && key == stop) {
        e.preventDefault()
        // console.log('stop button')
        document.getElementsByClassName('stop-all_stop-all_1Y8P9')[0].click();
      }
    }
  )
}
