export default async function ({ addon, msg, console }) {
  const topic = location.pathname.split("/")[3];
  new BroadcastChannel("sa-live-read-topics").postMessage(topic);
}
