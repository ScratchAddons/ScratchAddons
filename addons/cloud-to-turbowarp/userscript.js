export default async function ({ addon, console }) {
  const SCRATCH_CLOUD_HOST = "clouddata.scratch.mit.edu";
  const TURBOWARP_CLOUD_HOST = "clouddata.turbowarp.org";
  const RealWebSocket = window.WebSocket;

  function PatchedWebSocket(url, protocols) {
    try {
      const parsed = new URL(url);
      if (parsed.hostname === SCRATCH_CLOUD_HOST) {
        parsed.hostname = TURBOWARP_CLOUD_HOST;
        console.log("Redirected:", url, "→", parsed.href);
        url = parsed.href;
      }
    } catch (e) {}
    return protocols !== undefined
      ? new RealWebSocket(url, protocols)
      : new RealWebSocket(url);
  }

  PatchedWebSocket.prototype = RealWebSocket.prototype;
  for (const key of Object.getOwnPropertyNames(RealWebSocket)) {
    if (key !== "prototype" && key !== "length" && key !== "name") {
      try { PatchedWebSocket[key] = RealWebSocket[key]; } catch (e) {}
    }
  }

  window.WebSocket = PatchedWebSocket;

  addon.self.addEventListener("disabled", () => {
    window.WebSocket = RealWebSocket;
  });
  addon.self.addEventListener("reenabled", () => {
    window.WebSocket = PatchedWebSocket;
  });
}
