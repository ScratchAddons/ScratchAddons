export default async function ({ addon, console }) {
  function proxy2obj(obj) {
    return Object.fromEntries(Object.entries(obj));
  }

  addon.messaging.onMessage.addListener(function (m, s, sendResponse) {
    if (m.req === "getEnabled") {
      sendResponse(proxy2obj(scratchAddons.localState.addonsEnabled));
    }
  });
}
