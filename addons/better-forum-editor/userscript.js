export default async function ({ addon, _global, _console }) {
  let [ _marked, SimpleMDE] = await Promise.all([(async()=>new Function(await (await fetch("https://cdn.jsdelivr.net/gh/markedjs/marked/lib/marked.js")).text()))(),(async ()=>(
    await import(
      URL.createObjectURL(
        new Blob(
          [
            `export default (()=>{${(
              await (await fetch("https://cdn.jsdelivr.net/simplemde/latest/simplemde.min.js")).text()
            )
              .replace(/\!function\(.\)\{.+?.SimpleMDE=.\(\)\}\}\(function\(\)\{/, "")
              .slice(0, -2)})()`,
          ],
          {
            type: "text/javascript",
          }
        )
      )
    )
  ).default)(),
  addon.tab.waitForElement("")])
  const mf = (_) => {
    let o = {};
    _marked.call(o);
    return o.marked;
  };
  let oe = document.querySelector("#markItUpId_body");
  let editorp = oe.parentElement;
  oe.remove();
  let t = document.createElement("textarea");
  editorp.appendChild(t);
  let s = document.createElement("style");
  s.textContent = `@import url("https://cdn.jsdelivr.net/simplemde/latest/simplemde.min.css")`;
  editorp.appendChild(s);
  let i = document.createElement("input");
  i.type = "hidden";
  i.name = "body";
  editorp.appendChild(i);
  let marked = mf();
  let plainmarked = mf(); // WARNING: Decodes to not safe for Scratch language. Do NOT touch!
  /*let wordfilter = new RegExp("5c62286675676c797c285c772a3f296675636b285c772a3f297c6628757c767c5c2a293f633f6b28696e673f293f7c285c772a3f29736828697c317c6c2974285c772a3f297c637228617c407c5c2a2970287065727c7065647c79293f7c286261647c64756d627c6a61636b293f28617c402973732868286f7c30296c657c77697065293f7c286261647c64756d627c6a61636b293f28617c40297273652868286f7c30296c657c77697065293f7c626173746172647c6228697c317c6c7c5c2a293f743f636828653f73293f7c63756e747c63756d7c28676f643f293f64616d286e7c6d29286974293f7c646f75636865285c772a3f297c286e6577293f66616728676f747c676174293f7c667269672867656e7c67696e7c67696e67293f7c6f6d66677c70697373285c772a3f297c706f726e7c726170657c7265746172647c7365787c73206520787c736861747c736c75747c7469747c7768286f7c30297265285c772a3f297c777428667c66687c68292928737c6564293f5c62"
  .match(/../g)
  .map((e) => String.fromCharCode(parseInt(e, 16)))
  .join(""),
  "ig"
);*/ function isWhiteListed(
    link
  ) {
    return !!link.match(
      /(?:(?:tinypic|photobucket|cubeupload)\.com|imageshack\.(?:com|us)|modshare\.tk|(?:scratchr|wikipedia|wikimedia|modshare\.futuresight)\.org|\.edu|scratch-dach\.info)$/
    );
  }
  const renderer = {
    heading(text, level) {
      return `[big][b]${text}[/b][/big]
`;
    },
    code(code, infostring) {
      if (infostring == "scratchblocks")
        return `[scratchblocks]
${code}
[/scratchblocks]
`;
      return `[code${infostring ? "=" + infostring : ""}]
${code}
[/code]
`;
    },
    blockquote(quote) {
      return `[quote]${quote}[/quote]
`;
    },
    paragraph(text) {
      return `${text}
`;
    },
    strong(text) {
      return `[b]${text}[/b]`;
    },
    em(text) {
      return `[i]${text}[/i]`;
    },
    list(body, ordered, start) {
      return `[list${ordered ? "=" + start : ""}]${body}
[/list]
`;
    },
    listitem(text) {
      return `
[*] ${text}`;
    },
    checkbox(checked) {
      return "[img]https://u.cubeupload.com/easrng/baselinecheckbox" + (checked ? "blac" : "outl") + ".png[/img] ";
    },
    codespan(code) {
      return `[code]${code}[/code]`;
    },
    br() {
      return `
`;
    },
    del(text) {
      return `[s]${text}[/s]`;
    },
    link(href, title, text) {
      return `[url=${href}]${text}[/url]`;
    },
    image(link) {
      if (!isWhiteListed(link)) {
        let l = new URL(link);
        link = `https://secure.wikimedia.org/wikipedia/${l.hostname}%5C/..%5C${l.pathname.match(/^\/+(.+)$/)[1] || ""}`;
      }
      return `[img]${link}[/img]`;
    },
    text(text) {
      return text;
    },
    hr() {
      return `[img]https://u.cubeupload.com/easrng/imageedit16459946432.gif[/img]
`;
    },
    table() {
      throw new Error(`Tables aren't currently supported. Sorry!`);
    },
    html(h) {
      return h;
    },
  };
  marked.use({
    renderer,
  });
  let out;
  const textarea = t;
  let simplemde = new SimpleMDE({
    element: textarea,
    previewRender: plainmarked,
    status: 0,
    showIcons: [
      "bold",
      "italic",
      "heading",
      "|",
      "quote",
      "unordered-list",
      "ordered-list",
      "|",
      "link",
      "image",
      "|",
      "code",
      "",
      "preview",
      "side-by-side",
    ],
  });

  function update() {
    try {
      out = marked(simplemde.value());
    } catch (e) {
      alert(e.message);
    }
    i.value = out;
  }
  update();
  simplemde.codemirror.on("change", () => {
    update();
  });
}
