export default async function ({ addon, global, console, msg }) {
  const redirects = [
    { from: new RegExp("^/discuss/m/(.*)$"), to: "/discuss/$1", id: "mobileForums" },
    { from: new RegExp("^/news"), to: "/discuss/5/", id: "news" },
  ];

  let decodedURL = decodeURI(location.pathname);

  let rule = redirects.find((redirect) => addon.settings.get(redirect.id) && redirect.from.test(decodedURL));

  if (!rule) return;

  let url = decodedURL.replace(rule.from, rule.to);

  window.location.replace(url);
}
