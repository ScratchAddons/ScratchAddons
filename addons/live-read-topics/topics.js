export default async function ({ addon, msg, console }) {
  if (addon.self.disabled) return;
  const topic = location.pathname.split("/")[3];
  new BroadcastChannel("sa-live-read-topics").postMessage(topic);
}
