import type UserscriptAddon from "./addon-api/content-script/Addon.js";
import type PersistentScriptAddon from "./addon-api/background/Addon.js";
import type chrome from "./libraries/chrome";
import type Auth from "./addon-api/common/Auth";
import type Self from "./addon-api/common/Self";
import type Settings from "./addon-api/common/Settings";
import type Tab from "./addon-api/content-script/Tab";
import type BackgroundLocalizationProvider from "./background/l10n";
type Script = {
  global: { [key: string]: any };
  console: Console;
  msg: () => string | null;
  msg: { locale: string };
  safeMsg: () => string | null;
};
declare global {
  //#region Addon APIs
  namespace Addon {
    export type Userscript = {
      addon: UserscriptAddon;
    } & Script;

    export type PersistentScript = {
      addon: PersistentScriptAddon;

      // Borrowed from lib.dom.d.ts
      setInterval(handler: TimerHandler, timeout?: number, ...arguments: any[]): number;
      setTimeout(handler: TimerHandler, timeout?: number, ...arguments: any[]): number;
      clearInterval(handle?: number): void;
      clearTimeout(handle?: number): void;
    } & Script;
  }
  //#endregion
  interface Window {
    [key: string]: any;
  }
  declare const chrome: chrome;
  declare const InstallTrigger: undefined; // Technically defined in FF, but I'm not gonna type it
}
