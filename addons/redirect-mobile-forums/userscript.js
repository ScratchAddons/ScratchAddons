export default async (/** @type {Addon.Userscript} */ { addon, console, msg }) => {
  window.location.replace(window.location.href.replace("m/", ""));
};
