import "./set-lang.js";
import Addon from "../addon-api/popup/Addon.js";
import WebsiteLocalizationProvider from "../libraries/common/website-l10n.js";
import globalTheme from "../../libraries/common/global-theme.js";

const scratchAddons = (window.scratchAddons = {});
// Store event targets for addon.* API events
scratchAddons.eventTargets = {
  auth: [],
  settings: [],
  self: [],
};
scratchAddons.localEvents = new EventTarget();
scratchAddons.globalState = {};
scratchAddons.methods = {};
scratchAddons.l10n = new WebsiteLocalizationProvider();
scratchAddons.isLightMode = false;
scratchAddons.cookieFetchingFailed = false;
scratchAddons.cookies = new Map();

const promisify =
  (callbackFn) =>
  (...args) =>
    new Promise((resolve) => callbackFn(...args, resolve));

function getCookieValue(name, getCookie, storeId) {
  return new Promise((resolve) => {
    chrome.cookies.get(
      {
        url: "https://scratch.mit.edu/",
        name,
        storeId,
      },
      (cookie) => {
        if (cookie && cookie.value) resolve(getCookie ? cookie : cookie.value);
        else resolve(null);
      }
    );
  });
}

async function getActualCookieStore() {
  // Due to https://bugzilla.mozilla.org/show_bug.cgi?id=1747283
  // calling chrome.cookies.get without storeId on containers returns
  // the cookie for the default context, not container context.
  // Since popups can't be containers, they must be tabs,
  // which means tabs.getCurrent can be used to grab the store ID instead.
  const current = await promisify(chrome.tabs.getCurrent.bind(chrome.tabs))();
  // Return undefined in popup
  return current?.cookieStoreId || undefined;
}

async function refetchCookies(needsRequest = true) {
  if (needsRequest) {
    try {
      await fetch("https://scratch.mit.edu/csrf_token/");
    } catch (e) {
      console.error(e);
      scratchAddons.cookieFetchingFailed = true;
      return;
    }
  }
  const tabCookieStoreId = await getActualCookieStore();
  const scratchLang = (await getCookieValue("scratchlanguage", false, tabCookieStoreId)) || navigator.language;
  const csrfTokenCookie = await getCookieValue("scratchcsrftoken", true, tabCookieStoreId);
  scratchAddons.cookieStoreId = tabCookieStoreId || csrfTokenCookie.storeId;
  scratchAddons.cookies.set("scratchlanguage", scratchLang);
  scratchAddons.cookies.set("scratchcsrftoken", csrfTokenCookie.value);
}

async function refetchSession(addon) {
  let res;
  let d;
  if (scratchAddons.isFetchingSession) return;
  scratchAddons.isFetchingSession = true;
  addon.auth._refresh();
  try {
    res = await fetch("https://scratch.mit.edu/session/", {
      headers: {
        "X-Requested-With": "XMLHttpRequest",
      },
    });
    d = await res.json();
  } catch (e) {
    d = {};
    console.warn("Session fetch failed: ", e);
    if ((res && !res.ok) || !res) setTimeout(() => this.refetchSession(addon), 60000);
  }
  scratchAddons.session = d;
  addon.auth._update(d);
  scratchAddons.isFetchingSession = false;
}

(async () => {
  const addonId = location.pathname.split("/")[2];

  const sendMessage = promisify(chrome.runtime.sendMessage.bind(chrome.runtime));
  const popupData = await sendMessage({
    requestPopupInfo: {
      addonId,
    },
  });
  scratchAddons.globalState = {
    addonSettings: popupData.settings,
  };

  /*
   Popups do not have tab ID, so it is not possible to send messages from
   background to popup (unless as part of the callback) with the traditional
   sendMessage API. By creating a port and holding a reference of it on the
   background script it can send messages. Note that we still use sendMessage
   to send to background to reduce code duplication.

   Once the background acknowledges the connection, it sends a ping.
  */
  const port = chrome.runtime.connect(undefined, { name: addonId });
  await new Promise((resolve) => {
    port.onMessage.addListener((value) => {
      if (value === "ping") resolve();
    });
  });

  scratchAddons.methods.getEnabledAddons = (tag) =>
    sendMessage({
      getEnabledAddons: {
        tag,
      },
    });

  await refetchCookies();

  const addon = new Addon({
    id: addonId,
  });

  port.onMessage.addListener((request) => {
    if (request.newGlobalState) {
      scratchAddons.globalState = request.newGlobalState;
      return;
    }
    if (request.fireEvent && request.fireEvent.addonId === addonId) {
      scratchAddons.eventTargets[request.fireEvent.target]?.forEach((t) =>
        t.dispatchEvent(new CustomEvent(request.fireEvent.name))
      );
      return;
    }
    if (request.refetchSession) {
      refetchCookies(false).then(() => refetchSession(addon));
      return;
    }
  });

  await scratchAddons.l10n.loadByAddonId(addonId);
  refetchSession(addon); // No await intended; session fetched asynchronously
  const msg = (key, placeholders) =>
    scratchAddons.l10n.get(key.startsWith("/") ? key.slice(1) : `${addonId}/${key}`, placeholders);
  msg.locale = scratchAddons.l10n.locale;

  const fileName = popupData.popup.script;
  const module = await import(chrome.runtime.getURL(`/popups/${addonId}/${fileName}`));
  module.default({
    addon: addon,
    console,
    msg,
    safeMsg: (key, placeholders) =>
      scratchAddons.l10n.escaped(key.startsWith("/") ? key.slice(1) : `${addonId}/${key}`, placeholders),
  });
})();

globalTheme().then(({ theme }) => {
  scratchAddons.isLightMode = theme;
});

if (window.parent === window) {
  document.body.classList.add("fullscreen");
  document.documentElement.classList.add("fullscreen");
}

document.head.appendChild(
  Object.assign(document.createElement("link"), {
    rel: "icon",
    href: chrome.runtime.getManifest().version_name.endsWith("-prerelease")
      ? "../../images/icon-blue.png"
      : "../../images/icon.png",
    id: "favicon",
  })
);
