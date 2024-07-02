export default async function ({ addon, msg, console }) {
  const oldSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.send = function () {
    (async () => {
      if (!addon.self.disabled && this.method === "POST" && this.url?.startsWith("https://backpack.scratch.mit.edu/")) {
        try {
          const arg = JSON.parse(arguments[0]);
          if (arg.type === "script") {
            arg.name = (
              await addon.tab.prompt(msg("title"), msg("prompt"), arg.name, {
                useEditorClasses: true,
              })
            ).substring(0, 255);
          }
          arguments[0] = JSON.stringify(arg);
        } catch {}
      }

      oldSend.call(this, ...arguments);
    })();
  };
}
