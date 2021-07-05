import type UserscriptAddon from "./addon-api/content-script/Addon.js";
import type PersistentScriptAddon from "./addon-api/background/Addon.js";
import type Auth from "./addon-api/common/Auth";
import type Self from "./addon-api/common/Self";
import type Settings from "./addon-api/common/Settings";
import type Tab from "./addon-api/content-script/Tab";

import type BackgroundLocalizationProvider from "./background/l10n";
import type UserscriptLocalizationProvider from "./content-scripts/inject/l10n";
import type { SharedObserver } from "./content-scripts/inject/module";

import type Chrome from "./libraries/types/chrome";
import type Comlink from "./libraries/types/comlink";

export type msg = (key: string, placeholders: { [key: string]: string }) => string | null;

//#region scratchAddons APIs
export interface globalState {
  addonSettings: {
    _target?: { [key: string]: { [key: string]: string | boolean | number } };
    [key: string]: { [key: string]: string | boolean | number };
  };
  auth: {
    _target?: {
      csrfToken?: string;
      isLoggedIn: boolean;
      scratchLang: string;
      userId?: number;
      username?: string;
      xToken?: string;
    };
    csrfToken?: string;
    isLoggedIn: boolean;
    scratchLang: string;
    userId?: number;
    username?: string;
    xToken?: string;
  };
}

interface localState {
  addonsEnabled: { _target?: { [key: string]: boolean }; [key: string]: boolean };
  allReady: boolean;
  badges: {
    _target?: { [key: string]: { text: string | null; color: string | chrome.browserAction.ColorArray | null } };
    [key: string]: { text: string | null; color: string | chrome.browserAction.ColorArray | null };
  };
  ready: {
    _target?: {
      auth: boolean;
      manifests: boolean;
      addonSettings: boolean;
    };
    auth: boolean;
    manifests: boolean;
    addonSettings: boolean;
  };
}

export interface cs {
  /** @privte */
  _url: string;
  url: string;
  requestMsgCount: () => void;
  copyImage: (dataURL: string) => Promise<void>;
}

export interface page {
  /** @private */
  _globalState: globalState;
  globalState: globalState & {
    _target?: globalState | void;
  };

  l10njson: string[];
  addonsWithUserscripts: {
    addonId: string;
    scripts: {
      url: string;
      runAtComplete: boolean;
    }[];
  }[];
  /** @private */
  _dataReady: boolean;
  dataReady: boolean;

  runAddonUserscripts: (info: { addonId: any; scripts: any; enabledLate?: boolean }) => Promise<void>;

  fireEvent: (info: { name: string; addonId?: string; target: "auth" | "self" | "settings" | "tab" }) => void;
  setMsgCount: ({ count: number }) => void;
}
//#endregion

declare global {
  //#region Addon APIs
  namespace AddonAPIs {
    export type Userscript = {
      safeMsg: msg;
      addon: UserscriptAddon;
    } & Script;

    export type PersistentScript = {
      addon: PersistentScriptAddon;

      // Borrowed from @types/node/globals.d.ts
      setInterval: (callback: (...args: any[]) => void, ms?: number, ...args: any[]) => NodeJS.Timeout;
      setTimeout: (callback: (...args: any[]) => void, ms?: number, ...args: any[]) => NodeJS.Timeout;
      clearInterval: (intervalId: NodeJS.Timeout) => void;
      clearTimeout: (timeoutId: NodeJS.Timeout) => void;
    } & Script;
  }
  type Script = {
    global: { [key: string]: any };
    console: Console;
    msg: msg & { locale: string };
  };
  //#endregion
  //#region scratchAddons APIs
  declare const scratchAddons: {
    muted?: boolean;
    addonObjects?: PersistentScriptAddon[];
    classNames?: { loaded: boolean; arr?: string[] };
    eventTargets: {
      auth: Auth[];
      self: Self[];
      settings: Settings[];
      tab?: Tab[];
    };
    localEvents?: EventTarget;
    l10n: BackgroundLocalizationProvider | UserscriptLocalizationProvider;
    globalState: {
      _target?: globalState;
    } & globalState;
    localState?: {
      _target?: localState;
    } & localState;
    methods: {
      clearMessages?: () => Promise<void>;
      getMessages?: (opts?: { offset?: number }) => Promise<Message[]>;
      getMsgCount?: () => Promise<number>;
      copyImage?: (dataUrl: string) => Promise<void>;
    };
    manifests?: {
      addonId: string;
      manifest: any;
    }[];
    sharedObserver?: SharedObserver;
  };
  declare const _realConsole: Console;
  declare const __scratchAddonsRedux: {
    target?: EventTarget;
    dispatch?: (payload: { type: string; [key: string]: any }) => any;
    state: any; // lol way to much to try to type, even using AI
  };
  declare const __scratchAddonsTraps: EventTarget & { _onceMap: { [key: string]: any } };
  declare const __REDUX_DEVTOOLS_EXTENSION_COMPOSE__: (...args: any[]) => any;
  //#endregion
  interface Window {
    [key: string]: any;
  }
  interface Event {
    detail?: any;
  }
  namespace chrome.webRequest {
    export var OnBeforeSendHeadersOptions = any;
    export interface WebRequestHeadersDetails {
      originUrl?: string;
    }
  }
  declare namespace chrome.tabs {
    export interface Tab {
      frameId?: number;
    }
  }
  declare const chrome: void | Chrome;
  declare const Comlink: void | Comlink;

  declare const browser: void | Chrome; // Technically not identical to `chrome`, but I'm not gonna type it
  declare const InstallTrigger: void; // Technically defined in FF, but I'm not gonna type it
}
