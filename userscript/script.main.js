const promises = [
  import("https://userscript.scratchaddons.cf/content-scripts/prototype-handler.js"),
  import("https://userscript.scratchaddons.cf/content-scripts/load-redux.js"),
  import("https://userscript.scratchaddons.cf/content-scripts/fix-console.js"),
  import("https://userscript.scratchaddons.cf/libraries/common/cs/text-color.js"),
];

function updateAttrs(target, source) {
  Array.from(target.attributes).forEach((attr) => target.removeAttribute(attr.name));

  Array.from(source.attributes).forEach((attr) => target.setAttribute(attr.name, attr.value));
}

if (/^\/(scratch\-addons\-extension|sa\-ext|sa|scratch-addons|)\/settings\/?$/i.test(location.pathname)) {
  fetch("https://userscript.scratchaddons.cf/webpages/settings/scratch.html")
    .then((r) => r.text())
    .then(async (html) => {
      const dom = new DOMParser().parseFromString(html, "text/html");
      window.stop();

      updateAttrs(document.documentElement, dom.documentElement);

      if (!document.head) document.documentElement.append(document.createElement("head"));
      updateAttrs(document.head, dom.head);
      document.head.innerHTML = "";
      const deferred = [];
      for (const element of [...dom.head.children]) {
        if (element.tagName === "SCRIPT") {
          const run = async () => {
            const load = async () => {
              return await import(
                element.src
                  ? new URL(element.src, document.baseURI).href
                  : "data:text/javascript," + element.textContent
              );
            };
            if (element.async) setTimeout(async () => await load(), 0);
            else await load();
          };

          if (element.defer) deferred.push(run);
          else await run();
        } else {
          document.head.append(element.cloneNode(true));
        }
      }

      if (!document.body) document.documentElement.append(document.createElement("body"));
      updateAttrs(document.body, dom.body);
      document.body.innerHTML = dom.body.innerHTML;

      for (const run of deferred) await run();
    });
} else {
  document.documentElement.append(
    Object.assign(document.createElement("script"), {
      src: "https://userscript.scratchaddons.cf/webpages/check-unsupported.js",
      type: "module",
    })
  );
  Promise.all(promises).then(() =>
    document.documentElement.append(
      Object.assign(document.createElement("script"), {
        src: "https://userscript.scratchaddons.cf/content-scripts/cs.js",
        type: "module",
      })
    )
  );
}
