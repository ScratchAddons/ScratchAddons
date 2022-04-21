export default async function ({ addon, global }) {
  let event = new CustomEvent("resize");
  addon.self.addEventListener("reenabled", () =>
    window.dispatchEvent(event);
  );
}
