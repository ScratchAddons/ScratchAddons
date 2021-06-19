import UserscriptAddon from "./content-script/Addon.js";
import PersistentScriptAddon from "./background/Addon.js";

interface Script {
  global: Object;
  console: Console;
  msg: () => String | null;
  safeMsg: () => String | null;
}

export interface Userscript extends Script {
  addon: UserscriptAddon;
}

export interface PersistentScript extends Script {
  addon: PersistentScriptAddon;

  // Borrowed from lib.dom.d.ts
  setInterval(handler: TimerHandler, timeout?: number, ...arguments: any[]): number;
  setTimeout(handler: TimerHandler, timeout?: number, ...arguments: any[]): number;
  clearInterval(handle?: number): void;
  clearTimeout(handle?: number): void;
}

export as namespace Addon;
