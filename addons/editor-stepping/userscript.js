import { getRunningThread } from "../debugger/module.js";
import Highlighter from "./highlighter.js";

export default async function ({ addon, console }) {
  const vm = addon.tab.traps.vm;

  const highlighter = new Highlighter(0, addon.settings.get("highlight-color"));
  addon.settings.addEventListener("change", () => {
    highlighter.setColor(addon.settings.get("highlight-color"));
  });

  addon.self.addEventListener("disabled", () => {
    highlighter.setGlowingThreads([]);
  });

  const oldStep = vm.runtime._step;
  vm.runtime._step = function (...args) {
    oldStep.call(this, ...args);
    if (!addon.self.disabled) {
      const runningThread = getRunningThread();
      const threads = vm.runtime.threads.filter(
        (thread) => thread !== runningThread && !thread.target.blocks.forceNoGlow,
      );
      highlighter.setGlowingThreads(threads);
    }
  };
}
