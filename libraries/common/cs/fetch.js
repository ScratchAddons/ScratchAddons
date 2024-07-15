const originalFetch = fetch;
const traceableFetch = async (url, options, context, addonId = "") => {
  let baseUrl;
  if (context == "addon" || context == "cs") {
    baseUrl = window.location.href;
  } else if (context == "extension") {
    baseUrl = undefined;
  }
  const urlObj = new URL(url, baseUrl);
  urlObj.searchParams.append("sa", context);
  if (context == "addon") {
    urlObj.searchParams.append("sa-addon-id", addonId);
  }
  return originalFetch(urlObj, options);
};

export const traceableFetchAddon = (addonId) => {
  return async (url, options) => {
    return traceableFetch(url, options, "addon", addonId);
  };
};
export const traceableFetchCS = async (url, options) => {
  return traceableFetch(url, options, "cs");
};
export const traceableFetchExtension = async (url, options) => {
  return traceableFetch(url, options, "extension");
};
