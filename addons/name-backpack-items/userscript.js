export default async function ({ addon, msg, global, console }) {
  const oldSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.send = function () {
    if (this.method === "POST" && this.url.startsWith("https://backpack.scratch.mit.edu/")) {
      arguments[0] = JSON.parse(arguments[0]);
      console.log(arguments[0]);
      if (arguments[0].type === "script") {
        arguments[0].name = prompt(msg("prompt"), arguments[0].name);
      }
      arguments[0] = JSON.stringify(arguments[0]);
    }
    oldSend.call(this, ...arguments);
  };
}
