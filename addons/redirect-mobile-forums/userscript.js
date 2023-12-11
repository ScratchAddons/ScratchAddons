export default async function ({ addon, console, msg }) {
  if (window.location.href.includes("https://scratch.mit.edu/discuss/m")) window.location.replace(window.location.href.replace("m/", ""));
}
