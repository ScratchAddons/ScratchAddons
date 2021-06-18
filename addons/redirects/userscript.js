export default async function ({ addon, global, console, msg }) {
  let redirects = [
    { id: "mobileForums", url: ["/discuss/m/*", "/discuss/$1"] },
    { id: "news", url: ["/news", "/discuss/5"] },
  ];

  let redirect = redirects.find((redirect) => {
    return addon.settings.get(redirect.id) && new RegExp(redirect.url[0], "g").test(redirect.url[0]);
  });

  if (!redirect) return;

  if (!redirect.url[0].includes("*")) return window.location.replace(`https://scratch.mit.edu${redirect.url[1]}`);

  let afterStar = window.location.pathname.substring(redirect.url[0].indexOf("*"));

  let url = redirect.url[1].replace("$1", afterStar);

  window.location.replace(`https://scratch.mit.edu${url}`);
}
