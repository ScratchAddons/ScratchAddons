export default async function ({ addon, global, console }) {
  // check if setting enabled
  if (addon.settings.get("twelve-hour-time") === false) return;

  const boxHeads = document.querySelectorAll(".box-head");
  boxHeads.forEach((el) => {
    if (!el.getElementsByTagName("a")[0]) return;
    const text = el.getElementsByTagName("a")[0].innerText;
    const dateCheck = handleFormatting(text);
    el.getElementsByTagName("a")[0].innerText = dateCheck;
  });

  // this part was mostly written by @towerofnix on github!

  function handleFormatting(text) {
    const formatter = new Intl.DateTimeFormat("default", {
      hour12: true,
      timeStyle: "medium",
      dateStyle: "long",
    });

    const timeParts = text.replace(/\./g, "").match(/^(.*?)\s+([0-9][0-9]):([0-9][0-9]):([0-9][0-9])$/);
    if (!timeParts) {
      console.warn(`Failed to parse forum timestamp: ${text}`);
      return;
    }

    const [day, hours, minutes, seconds] = timeParts.slice(1);

    let date;

    let isRelative = false;

    switch (day) {
      case "Today":
        isRelative = true;
        date = new Date();
        break;
      case "Yesterday":
        isRelative = true;
        date = new Date();
        date.setDate(date.getDate() - 1);
        break;
      default:
        date = new Date(day);
    }

    date.setHours(hours, minutes, seconds, 0);

    if (isNaN(date.getTime())) {
      console.warn(`Failed to calculate date/time for forum timestamp: ${text} - regex timeParts:`, timeParts);
      return;
    }

    let formattedDate = formatter.format(date);
    if (isRelative && addon.settings.get("relative-dates") === true) {
      const resetFormatter = new Intl.DateTimeFormat("default", {
        hour12: true,
        dateStyle: "long",
      });
      formattedDate = formattedDate.replace(resetFormatter.format(date), day);
    }

    return formattedDate;
  }
}
