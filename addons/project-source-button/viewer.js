const queries = (() => {
  const query = window.location.search.slice(1);
  const queries = {};
  if (!query) return {};
  for (let text of query.split("&")) {
    text = text.split("=");
    queries[text[0]] = text[1];
  }
  return queries;
})();
async function loadDom() {
  window.addEventListener("load", (e) => {
    Promise.resolve();
  });
}
(async function () {
  const cssLink = document.createElement("link");
  cssLink.rel = "stylesheet";
  cssLink.href = location.protocol + "//" + location.hostname + "/libraries/common/cs/prism.css"; //prism.css address
  document.head.appendChild(cssLink);

  const prismScript = document.createElement("script");
  prismScript.src = location.protocol + "//" + location.hostname + "/libraries/common/cs/prism.js"; //prism.js address
  document.head.appendChild(prismScript);
})();
let pageNum = 1;
const maxLines = parseInt(queries.maxlines);
(async function () {
  loadDom();
  document.getElementById("h-title").textContent = "Loding...";

  const jsonData = await (await fetch(`https://projects.scratch.mit.edu/${queries.id}?token=${queries.token}`)).json();

  const jsonText = JSON.stringify(jsonData, null, "  ");

  const lineLength = jsonText.split("\n").length;
  const pages = Math.ceil(lineLength / maxLines);

  document.getElementById("max-page").textContent = pages;
  function updatePage() {
    document.getElementById("page").textContent = pageNum;
    viewJSON(
      jsonText
        .split("\n")
        .slice((pageNum - 1) * maxLines, pageNum * maxLines - 1)
        .join("\n")
    );
  }
  document.getElementById("next").addEventListener("click", (e) => {
    if (pageNum === pages) return;
    pageNum++;
    updatePage();
  });
  document.getElementById("back").addEventListener("click", (e) => {
    if (pageNum === 1) return;
    pageNum--;
    updatePage();
  });
  document.getElementById("all-view").addEventListener("click",e=>{
    const allView=window.open("about:blank");
    const pre=document.createElement("pre");
    const jsonElem=document.createElement("code");
    jsonElem.textContent=jsonText;
    jsonElem.style["font-size"]="1rem";
    pre.appendChild(jsonElem)
    allView.document.body.appendChild(pre);
  });
  updatePage();
  let assets = [];
  function assetsSearch(arg) {
    if (arg === null) {
      return;
    }
    Object.keys(arg).forEach((key) => {
      if (typeof arg[key] === "object") {
        if (key === "sounds" || key === "costumes") {
          const data = arg[key];
          data.forEach((elem) => {
            elem.type = key;
          });
          assets = assets.concat(data);
        } else {
          assetsSearch(arg[key]);
        }
      }
    });
  }
  assetsSearch(jsonData);
  const assetsElem = document.getElementById("assets");
  function assetsInfo(obj) {
    const tr = document.createElement("tr");
    function addtd(arr) {
      // add td tag function
      arr.forEach((elem) => {
        const td = document.createElement("td");
        td.innerHTML = elem;
        tr.appendChild(td);
      });
    }
    addtd([
      obj.type,
      obj.name,
      obj.dataFormat,
      `<a href="https://cdn.assets.scratch.mit.edu/internalapi/asset/${obj.md5ext}/get/">URL</a>`,
      obj.assetId,
      ((rate) => {
        if (rate == null) {
          return "--";
        }
        return rate + "Hz";
      })(obj.rate),
    ]);
    return tr;
  }
  const assetsTable = document.createElement("table");
  const ths = document.createElement("tr");
  ths.innerHTML = `<th>Type</th><th>Name</th><th>Format</th><th>CDN</th><th>MD5</th><th>Sound rate</th>`;
  assetsTable.appendChild(ths);
  assets.forEach((elem) => assetsTable.appendChild(assetsInfo(elem)));
  assetsElem.appendChild(assetsTable);

  document.getElementById("h-title").textContent = "Sources";
})();
function viewJSON(text) {
  const highlightHTML = Prism.highlight(text, Prism.languages.json, "json");
  document.getElementsByClassName("language-json")[0].innerHTML = highlightHTML;
}
