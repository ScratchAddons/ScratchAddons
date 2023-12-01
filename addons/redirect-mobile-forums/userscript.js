export default async function ({ addon, console }) {
  if (window.location.pathname.startsWith("/discuss/m/")) {
    window.location.replace(window.location.href.replace("m/", ""));
  }
}
