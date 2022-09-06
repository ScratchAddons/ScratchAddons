export default async function ({ addon, global, console }) {
  let green_flag = addon.settings.get("greenflag").toLowerCase();
  let pause_key = addon.settings.get("pause").toLowerCase();
  let stop = addon.settings.get("stop").toLowerCase();
  console.log("Player controls", green_flag, pause_key, stop);

  addon.settings.addEventListener("change", function () {
    green_flag = addon.settings.get("greenflag").toLowerCase();
    pause_key = addon.settings.get("pause").toLowerCase();
    stop = addon.settings.get("stop").toLowerCase();
    console.log("Player controls", green_flag, pause_key, stop);
  });

  document.addEventListener("keydown", function (e) {
    let pause = getComputedStyle(document.documentElement).getPropertyValue("--pause-_displayNoneWhileDisabledValue");
    let ctrlKey = e.ctrlKey || e.metaKey;
    let key = e.key.toLowerCase();

    if (ctrlKey && [green_flag, pause_key, stop].includes(key)) {
      // console.log(e.key);
      e.preventDefault();
    } else {
      return;
    }

    if (ctrlKey && key == pause_key) {
      e.preventDefault();
      //  console.log('pause')
      if (!pause) {
        document.getElementsByClassName("pause-btn")[0].click();
      }
    } else if (ctrlKey && key == green_flag) {
      e.preventDefault();
      // console.log('green flag')
      document.getElementsByClassName("green-flag_green-flag_1kiAo")[0].click();
    } else if (ctrlKey && key == stop) {
      e.preventDefault();
      // console.log('stop button')
      document.getElementsByClassName("stop-all_stop-all_1Y8P9")[0].click();
    }
  });
}
