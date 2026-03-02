export const onReady = (fn) => {
  if (scratchAddons.localState.allReady) {
    fn();
    return undefined;
  } else {
    scratchAddons.localEvents.addEventListener("ready", () => fn(), { once: true });
    // https://developer.chrome.com/docs/extensions/develop/concepts/messaging#simple
    // "The sendResponse() callback is only valid if used synchronously, or if the event
    // handler returns true to indicate that it will respond asynchronously"
    return true;
  }
};
