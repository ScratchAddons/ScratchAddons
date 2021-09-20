import runAddonUserscripts from "./run-userscript.js";
import Localization from "./l10n.js";

await Promise.all([
  loadScriptFromUrl("libraries/common/cs/text-color.js"),
  loadScriptFromUrl("content-scripts/prototype-handler.js"),
  loadScriptFromUrl("content-scripts/load-redux.js"),
  loadScriptFromUrl("content-scripts/fix-console.js"),
]);

window.scratchAddons = {};
scratchAddons.classNames = { loaded: false };
scratchAddons.eventTargets = {
  auth: [],
  settings: [],
  tab: [],
  self: [],
};
scratchAddons.session = {};
const consoleOutput = (logAuthor = "[page]") => {
  const style = {
    // Remember to change these as well on cs.js
    leftPrefix: "background:  #ff7b26; color: white; border-radius: 0.5rem 0 0 0.5rem; padding: 0 0.5rem",
    rightPrefix:
      "background: #222; color: white; border-radius: 0 0.5rem 0.5rem 0; padding: 0 0.5rem; font-weight: bold",
    text: "",
  };
  return [`%cSA%c${logAuthor}%c`, style.leftPrefix, style.rightPrefix, style.text];
};
scratchAddons.console = {
  log: _realConsole.log.bind(_realConsole, ...consoleOutput()),
  warn: _realConsole.warn.bind(_realConsole, ...consoleOutput()),
  error: _realConsole.error.bind(_realConsole, ...consoleOutput()),
  logForAddon: (addonId) => _realConsole.log.bind(_realConsole, ...consoleOutput(addonId)),
  warnForAddon: (addonId) => _realConsole.warn.bind(_realConsole, ...consoleOutput(addonId)),
  errorForAddon: (addonId) => _realConsole.error.bind(_realConsole, ...consoleOutput(addonId)),
};

const getSession = {
  isFetching: false,
  async refetchSession() {
    let res;
    let d;
    if (this.isFetching) return;
    this.isFetching = true;
    scratchAddons.eventTargets.auth.forEach((auth) => auth._refresh());
    try {
      res = await fetch("https://scratch.mit.edu/session/", {
        headers: {
          "X-Requested-With": "XMLHttpRequest",
        },
      });
      d = await res.json();
    } catch (e) {
      d = {};
      scratchAddons.console.warn("Session fetch failed: ", e);
      if ((res && !res.ok) || !res) setTimeout(() => this.refetchSession(), 60000);
    }
    scratchAddons.session = d;
    scratchAddons.eventTargets.auth.forEach((auth) => auth._update(d));
    this.isFetching = false;
  },
};

function getURL(url) {
  return new URL("../../" + url, import.meta.url).href;
}

class SharedObserver {
  constructor() {
    this.inactive = true;
    this.pending = new Set();
    this.observer = new MutationObserver((mutation, observer) => {
      for (const item of this.pending) {
        if (item.condition && !item.condition()) continue;
        for (const match of document.querySelectorAll(item.query)) {
          if (item.seen?.has(match)) continue;
          if (item.elementCondition && !item.elementCondition(match)) continue;
          item.seen?.add(match);
          this.pending.delete(item);
          item.resolve(match);
          break;
        }
      }
      if (this.pending.size === 0) {
        this.inactive = true;
        this.observer.disconnect();
      }
    });
  }

  /**
   * Watches an element.
   *
   * @param {object} opts - Options
   * @param {string} opts.query - Query.
   * @param {WeakSet} [opts.seen] - A WeakSet that tracks whether an element has already been seen.
   * @param {function} [opts.condition] - A function that returns whether to resolve the selector or not.
   * @param {function} [opts.elementCondition] - A function that returns whether to resolve the selector or not, given an element.
   * @returns {Promise<Node>} Promise that is resolved with modified element.
   */
  watch(opts) {
    if (this.inactive) {
      this.inactive = false;
      this.observer.observe(document.documentElement, {
        subtree: true,
        childList: true,
      });
    }
    return new Promise((resolve) =>
      this.pending.add({
        resolve,
        ...opts,
      })
    );
  }
}

// Pathname patterns. Make sure NOT to set global flag!
// Don't forget ^ and $
const WELL_KNOWN_PATTERNS = {
  projects: /^\/projects\/(?:editor|\d+(?:\/(?:fullscreen|editor))?)\/?$/,
  projectEmbeds: /^\/projects\/\d+\/embed\/?$/,
  studios: /^\/studios\/\d+(?:\/(?:projects|comments|curators|activity))?\/?$/,
  profiles: /^\/users\/[\w-]+\/?$/,
  topics: /^\/discuss\/topic\/\d+\/?$/,
  newPostScreens: /^\/discuss\/(?:topic\/\d+|\d+\/topic\/add)\/?$/,
  editingScreens: /^\/discuss\/(?:topic\/\d+|\d+\/topic\/add|post\/\d+\/edit|settings\/[\w-]+)\/?$/,
  forums: /^\/discuss(?!\/m(?:$|\/))(?:\/.*)?$/,
  scratchWWWNoProject:
    /^\/(?:(?:about|annual-report|camp|conference\/20(?:1[79]|[2-9]\d|18(?:\/(?:[^\/]+\/details|expect|plan|schedule))?)|contact-us|credits|developers|DMCA|download(?:\/scratch2)?|educators(?:\/faq|register|waiting)?|explore\/(?:project|studio)s\/\w+(?:\/\w+)?|info\/faq|community_guidelines|ideas|join|messages|parents|privacy_policy|research|scratch_1\.4|search\/(?:project|studio)s|starter-projects|classes\/(?:complete_registration|[^\/]+\/register\/[^\/]+)|signup\/[^\/]+|terms_of_use|wedo(?:-legacy)?|ev3|microbit|vernier|boost|studios\/\d*(?:\/(?:projects|comments|curators|activity))?)\/?)?$/,
};

const WELL_KNOWN_MATCHERS = {
  isNotScratchWWW: (match) => {
    const { projects, projectEmbeds, scratchWWWNoProject } = WELL_KNOWN_PATTERNS;
    return !(projects.test(match) || projectEmbeds.test(match) || scratchWWWNoProject.test(match));
  },
};

async function onDataReady() {
  const addons = (await fetch(getURL("addons/addons.json")).then((r) => r.json())).filter(
    (addon) => !addon.startsWith("//")
  );

  function getL10NURLs() {
    const langCode = /scratchlanguage=([\w-]+)/.exec(document.cookie)?.[1] || "en";
    const urls = [getURL(`addons-l10n/${langCode}`)];
    if (langCode === "pt") {
      urls.push(getURL(`addons-l10n/pt-br`));
    }
    if (langCode.includes("-")) {
      urls.push(getURL(`addons-l10n/${langCode.split("-")[0]}`));
    }
    const enJSON = getURL("addons-l10n/en");
    if (!urls.includes(enJSON)) urls.push(enJSON);
    return urls;
  }

  scratchAddons.l10n = new Localization(getL10NURLs());

  scratchAddons.methods = {};
  scratchAddons.methods.getMsgCount = () => {
    let promiseResolver;
    const promise = new Promise((resolve) => (promiseResolver = resolve));
    pendingPromises.msgCount.push(promiseResolver);
    // 1 because the array was just pushed
    if (pendingPromises.msgCount.length === 1) requestMsgCount();
    return promise;
  };

  scratchAddons.sharedObserver = new SharedObserver();

  // regexPattern = "^https:(absolute-regex)" | "^(relative-regex)"
  // matchesPattern = "*" | regexPattern | Array<wellKnownName | wellKnownMatcher | regexPattern | legacyPattern>
  function userscriptMatches(data, scriptOrStyle, addonId) {
    // if (scriptOrStyle.if && !matchesIf(scriptOrStyle, scratchAddons.globalState.addonSettings[addonId])) return false;
    // todo ^

    const url = data.url;
    const parsedURL = new URL(url);
    const { matches, _scratchDomainImplied } = scriptOrStyle;
    const parsedPathname = parsedURL.pathname;
    const parsedOrigin = parsedURL.origin;
    const originPath = parsedOrigin + parsedPathname;
    const matchURL = _scratchDomainImplied ? parsedPathname : originPath;
    const scratchOrigin = "https://scratch.mit.edu";
    const isScratchOrigin = parsedOrigin === scratchOrigin;
    // "*" is used for any URL on Scratch origin
    if (matches === "*") return isScratchOrigin;
    // matches becomes RegExp if it is a string that starts with ^
    if (matches instanceof RegExp) {
      if (_scratchDomainImplied && !isScratchOrigin) return false;
      return matches.test(matchURL);
    }
    for (const match of matches) {
      if (match instanceof RegExp) {
        if (match._scratchDomainImplied && !isScratchOrigin) continue;
        if (match.test(match._scratchDomainImplied ? parsedPathname : originPath)) {
          return true;
        }
      } else if (Object.prototype.hasOwnProperty.call(WELL_KNOWN_PATTERNS, match)) {
        if (isScratchOrigin && WELL_KNOWN_PATTERNS[match].test(parsedPathname)) return true;
      } else if (Object.prototype.hasOwnProperty.call(WELL_KNOWN_MATCHERS, match)) {
        if (isScratchOrigin && WELL_KNOWN_MATCHERS[match](parsedPathname)) return true;
      } else if (urlMatchesLegacyPattern(match, parsedURL)) return true;
    }
    return false;
  }

  function runUserscripts() {
    addons.forEach(async (addonId) => {
      const manifest = await fetch(getURL("addons/" + addonId + "/addon.json")).then((r) => r.json());

      for (const injectable of manifest.userscripts || []) {
        const { matches } = injectable;
        if (typeof matches === "string" && matches.startsWith("^")) {
          injectable._scratchDomainImplied = !matches.startsWith("^https:");
          injectable.matches = new RegExp(matches, "u");
        } else if (Array.isArray(matches)) {
          for (let i = matches.length; i--; ) {
            const match = matches[i];
            if (typeof match === "string" && match.startsWith("^")) {
              matches[i] = new RegExp(match, "u");
              matches[i]._scratchDomainImplied = !match.startsWith("^https:");
            }
          }
        }
        if (userscriptMatches({ url: location.href }, injectable, addonId))
          runAddonUserscripts({ addonId, scripts: [injectable] });
      }
    });
  }

  // Note: we currently load userscripts and locales after head loaded
  // We could do that before head loaded just fine, as long as we don't
  // actually *run* the addons before document.head is defined.
  if (document.head) runUserscripts();
  else {
    const observer = new MutationObserver(() => {
      if (document.head) {
        runUserscripts();
        observer.disconnect();
      }
    });
    observer.observe(document.documentElement, { subtree: true, childList: true });
  }
}

function loadClasses() {
  scratchAddons.classNames.arr = [
    ...new Set(
      [...document.styleSheets]
        .filter(
          (styleSheet) =>
            !(
              styleSheet.ownerNode.textContent.startsWith(
                "/* DO NOT EDIT\n@todo This file is copied from GUI and should be pulled out into a shared library."
              ) &&
              (styleSheet.ownerNode.textContent.includes("input_input-form") ||
                styleSheet.ownerNode.textContent.includes("label_input-group_"))
            )
        )
        .map((e) => {
          try {
            return [...e.cssRules];
          } catch (e) {
            return [];
          }
        })
        .flat()
        .map((e) => e.selectorText)
        .filter((e) => e)
        .map((e) => e.match(/(([\w-]+?)_([\w-]+)_([\w\d-]+))/g))
        .filter((e) => e)
        .flat()
    ),
  ];
  scratchAddons.classNames.loaded = true;

  const fixPlaceHolderClasses = () =>
    document.querySelectorAll("[class*='scratchAddonsScratchClass/']").forEach((el) => {
      [...el.classList]
        .filter((className) => className.startsWith("scratchAddonsScratchClass"))
        .map((className) => className.substring(className.indexOf("/") + 1))
        .forEach((classNameToFind) =>
          el.classList.replace(
            `scratchAddonsScratchClass/${classNameToFind}`,
            scratchAddons.classNames.arr.find(
              (className) =>
                className.startsWith(classNameToFind + "_") && className.length === classNameToFind.length + 6
            ) || `scratchAddonsScratchClass/${classNameToFind}`
          )
        );
    });

  fixPlaceHolderClasses();
  new MutationObserver(() => fixPlaceHolderClasses()).observe(document.documentElement, {
    attributes: false,
    childList: true,
    subtree: true,
  });
}

if (document.querySelector("title")) loadClasses();
else {
  const stylesObserver = new MutationObserver(() => {
    if (document.querySelector("title")) {
      stylesObserver.disconnect();
      loadClasses();
    }
  });
  stylesObserver.observe(document.documentElement, { childList: true, subtree: true });
}

function loadScriptFromUrl(url) {
  return new Promise((resolve, reject) => {
    const script = Object.assign(document.createElement("script"), {
      src: getURL(url),
    });
    script.addEventListener("load", () => {
      resolve();
    });
    document.body.append(script);
  });
}

onDataReady();
getSession.refetchSession();
