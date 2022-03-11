export default async function ({ addon, global, console }) {
  const boxHeads = document.querySelectorAll(".box-head");
  boxHeads.forEach((el) => {
    if (!el.getElementsByTagName("a")[0]) return;
    const text = el.getElementsByTagName("a")[0].innerText;
    const dateCheck = handleFormatting(text)
    el.getElementsByTagName("a")[0].innerText = dateCheck;
  });
}

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

  switch (day) {
    case "Today":
      date = new Date();
      break;
    case "Yesterday":
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

  return formatter.format(date);
}
