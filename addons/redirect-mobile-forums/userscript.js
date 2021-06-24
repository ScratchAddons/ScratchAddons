export default async (/** @type {AddonAPIs.Userscript} */ { addon, console, msg }) => {
  window.location.replace(window.location.href.replace("m/", ""));
};
