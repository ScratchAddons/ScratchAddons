const cache = new Map();

const escape = (string) => {
  return string.replaceAll("<", "&lt;");
};

export const getStatus = async (username) => {
  const isCached = cache.has(username);
  const ocularResponse =
    (isCached && cache.get(username).ocularResponse) ||
    (await fetch(`https://my-ocular.jeffalo.net/api/user/${username}`).then((response) => response.json()));
  const aviateResponse =
    (isCached && cache.get(username).aviateResponse) ||
    (await fetch(`https://corsproxy.io?https://aviate.scratchers.tech/api/${username}`).then((response) =>
      response.json()
    ));
  if (!isCached) {
    cache.set(username, { ocularResponse, aviateResponse });
  }
  return (
    "<span class='sa-status-ocular'>" +
    ("error" in ocularResponse
      ? ""
      : escape(ocularResponse.status) +
        `<span class='sa-status-dot' style='background-color:${ocularResponse.color}'></span>`) +
    `</span><br><span class='sa-status-aviate'>` +
    escape(aviateResponse.status ?? "") +
    "</span>"
  );
};
