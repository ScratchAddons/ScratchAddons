export default async function ({ addon, msg, global, console }) {
  const oldSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.send = function () {
    if (!addon.self.disabled && this.method === "POST" && this.url?.startsWith("https://backpack.scratch.mit.edu/")) {
      try {
        const arg = JSON.parse(arguments[0]);
        if (arg.type === "script") {
          arg.name = prompt(msg("prompt"), arg.name).substring(0, 255);
        }
        arguments[0] = JSON.stringify(arg);
      } catch {}
    }

    return oldSend.call(this, ...arguments);
  };
}
