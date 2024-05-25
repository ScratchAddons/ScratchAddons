// If this script is running, then none of the previews scripts threw any errors.

chrome.storage.session?.set({ backgroundContextOk: true });
// Ideally we would only run this once per service worker startup, but
// there's no straight-forward way it seems. A combination of
// onStartup and onUpdate might not cover all cases.
