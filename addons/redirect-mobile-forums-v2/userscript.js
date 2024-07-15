export default async function ({ addon, console, msg, fetch }) {
  if (window.location.pathname.startsWith("/discuss/m/"))
    window.location.replace(window.location.href.replace("m/", ""));
}
