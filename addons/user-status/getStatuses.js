const cache = new Map();

const createStatus = (status, name, hover, icon, color) => {
  const result = document.createElement("span");
  result.classList.add("sa-status", `sa-status-${name}`);
  result.title = hover;
  const iconImg = document.createElement("img");
  iconImg.src = icon;
  result.appendChild(iconImg);
  const statusSpan = document.createElement("span");
  statusSpan.appendChild(document.createTextNode(status));
  if (color) {
    const dot = document.createElement("span");
    dot.classList.add("sa-status-dot");
    dot.style.backgroundColor = color;
    statusSpan.appendChild(dot);
  }
  result.appendChild(statusSpan);
  return result;
};

export const getStatuses = async (username, ocularHover, aviateHover) => {
  const isCached = cache.has(username);
  const ocularResponse =
    (isCached && cache.get(username).ocularResponse) ||
    (await fetch(`https://my-ocular.jeffalo.net/api/user/${username}`).then((response) => response.json()));
  const aviateResponse =
    (isCached && cache.get(username).aviateResponse) ||
    (await fetch(`https://aviate.scratchers.tech/api/${username}`).then((response) => response.json()));
  if (!isCached) {
    cache.set(username, { ocularResponse, aviateResponse });
  }
  const statusWrapper = document.createElement("span");
  statusWrapper.classList.add("sa-status-wrapper");
  if (!("error" in ocularResponse)) {
    statusWrapper.appendChild(
      createStatus(
        ocularResponse.status,
        "ocular",
        ocularHover,
        "https://ocular.jeffalo.net/favicon.ico",
        ocularResponse.color
      )
    );
  }
  if (aviateResponse.status) {
    statusWrapper.appendChild(
      createStatus(aviateResponse.status, "aviate", ocularHover, "https://aviate.scratchers.tech/favicon.svg")
    );
  }
  return statusWrapper;
};
