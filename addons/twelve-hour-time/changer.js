export default async function ({ addon, global, console }) {
  const boxHeads = document.querySelectorAll(".box-head");
  const formatter = new Intl.DateTimeFormat('default',
  {
      hour12: true,
      timeStyle: "medium",
      dateStyle: "long"
  });
  boxHeads.forEach((el) => {
    if(!el.getElementsByTagName("a")[0]) return;
    const text = el.getElementsByTagName("a")[0].innerText;
    const dateParse = text.replace(/[.]/g, '');
    let dateCheck;
    if (dateParse.startsWith("Yesterday")) {
      // I need help here
    } else {
      dateCheck = new Date(dateParse);
    }
    console.warn(text, dateParse)
    el.getElementsByTagName("a")[0].innerText = formatter.format(dateCheck)
    console.log(formatter.format(dateCheck))
  })
}
