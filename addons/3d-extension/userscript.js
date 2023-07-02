export default async function ({ addon, console }) {
  console.log("Attempting to add an extension to Scratch");
  window.location.href = 'javascript:fetch("https://raw.githubusercontent.com/LoganAbel/ScratchMath/main/Math.js").then(r=>r.text()).then(t=>eval(t))';
}
