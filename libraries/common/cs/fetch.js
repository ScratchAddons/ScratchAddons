const originalFetch = window.fetch;
const traceableFetch = async (url, options, context, addonId = "") => {
  // add sa=1 to the query string
  // check if running in background page

  let baseUrl;
  if (context == "addon" || context == "cs") {
    baseUrl = window.location.href;
  } else if (context == "background") {
    baseUrl = undefined;
  }
  const urlObj = new URL(url, baseUrl);
  urlObj.searchParams.append("sa", "1");
  if (context == "addon") {
    urlObj.searchParams.append("sa-addon-id", addonId);
  }
  return originalFetch(urlObj, options);
};

export const traceableFetchAddon =  (addonId) => {
  return async (url, options) => {
    return traceableFetch(url, options, "addon", addonId);
  };
};
export const traceableFetchCS = async (url, options) => {
  return traceableFetch(url, options, "cs");
};
export const traceableFetchBackground = async (url, options) => {
  return traceableFetch(url, options, "background");
};
