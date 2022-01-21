let id = 0;

export default function create(opts) {
  if (typeof opts !== "object") {
    throw new Error("ScratchAddons exception: do not specify a notification ID.");
  }
  if (scratchAddons.muted) return Promise.resolve(null);
  const notifId = `${opts.base}__${Date.now()}_${id++}`;
  let newOpts;
  if (typeof InstallTrigger !== "undefined") {
    newOpts = JSON.parse(JSON.stringify(opts));
    // On Firefox, remove notification properties that throw.
    delete newOpts.buttons;
    delete newOpts.requireInteraction;
    delete newOpts.silent;
  } else newOpts = opts;
  delete newOpts.base;
  newOpts.contextMessage = chrome.i18n.getMessage("extensionName");
  return new Promise((resolve) => {
    chrome.notifications.create(notifId, newOpts, () => resolve(notifId));
  });
}
