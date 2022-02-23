export default async function (/** @type {typeof UserscriptUtils} */ { addon, global, console, msg }) {
  window.location.replace(window.location.href.replace("m/", ""));
}
