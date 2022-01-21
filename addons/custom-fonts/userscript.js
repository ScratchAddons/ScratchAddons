export default async function ({ addon, console }) {
  //Easily expandable method of declaring options
  const options = [
    ["navfnt", "nav"],
    ["blockfnt", "blocks"],
    ["headfnt", "header"],
    ["mainfnt", "main"],
    ["editfnt", "editor"],
    ["footerfnt", "footer"],
    ["edmenfnt", "editorMenuBar"],
  ];

  addon.self.addEventListener("disabled", disable);

  addon.self.addEventListener("reenabled", enable);

  const BLANK_STYLE = `#navigation, #topnav {}
.blocklyText:not(.saWidthTestString), .blocklyHtmlInput, .scratchCommentBody, .scratchCommentText, .scratchblocks text  {}
.box-header, .box-head, form *, .tabs-index *, h1, h2, h3, h4, h5, h6 {}
.box-content, .project-title, .comment, .button, .preview-row {}
.scratchCategoryMenu, [role="tablist"], [class*="loader"], [class*="sprite-selector_sprite-selector"] *, [class*="target-pane_stage-selector-wrapper"] *, .pos-container > span, [class*="asset-panel_wrapper"] *:not(svg *) {}
#footer * {}
[class*="menu-bar_menu-bar"] {}`;

  //Default letter width to use when calculating the spacing needed
  let defWidth = await (async function () {
    let styl = Object.assign(document.createElement("style"), {
      textContent: `.saWidthTestString { font-family: Helvetica !important }`,
    });
    document.head.appendChild(styl);
    await new Promise((resolve) => {
      styl.addEventListener("load", resolve);
    });
    let w = getWidth();
    styl.remove();
    return w;
  })();

  let styleSheet = Object.assign(document.createElement("style"), {
    textContent: BLANK_STYLE,
    id: "sa-custom-font-stylesheet",
  });

  document.head.appendChild(styleSheet);

  let sheet = Array.from(document.styleSheets).find(function (sheet) {
    return sheet.ownerNode.id === "sa-custom-font-stylesheet";
  });

  let styles = {
    nav: sheet.cssRules[0],
    blocks: sheet.cssRules[1],
    header: sheet.cssRules[2],
    main: sheet.cssRules[3],
    editor: sheet.cssRules[4],
    footer: sheet.cssRules[5],
    editorMenuBar: sheet.cssRules[6],
  };

  //Disable the addon
  function disable() {
    styleSheet.disabled = true;
  }

  //Enable the addon
  function enable() {
    styleSheet.disabled = false;
  }

  //Load the fonts
  load();

  //Reload the fonts after a change
  addon.settings.addEventListener("change", () => load());

  async function load() {
    let fonts = options.map(([id, nme]) => addon.settings.get(id).trim()); //Get all of the fonts

    let needsLoad = fonts.filter((fnt) => !document.fonts.check(`12px ${fnt}`) && fnt.toLowerCase() !== "helvetica"); //The are the fonts that are not yet loaded on the website

    if (needsLoad.length > 0) {
      //Shouldn't load the fonts if the list is empty!
      let fontFaces = needsLoad.map(function (family) {
        return new FontFace(family, `url(${addon.self.dir + "/fonts/" + family.replace(/\s/g, "") + ".ttf"})`);
      });

      fontFaces = await Promise.all(
        fontFaces.map(function (face) {
          return new Promise((res) => {
            face
              .load()
              .then(res)
              .catch(() => res(null)); //Stop trying to load a font that we do not have a file for.
          });
        })
      ).filter(Boolean);

      fontFaces.forEach(function (face) {
        document.fonts.add(face);
      });
    }

    for (let [id, nme] of options) {
      let s = nme === "blocks" ? await calcSize(addon.settings.get(id).trim()) : 1;
      if (s > 1) s = 1;

      styles[nme].style.setProperty("font-family", addon.settings.get(id));

      if (s !== 1) {
        styles[nme].style.setProperty("font-size", `${s}em`);
      } else {
        styles[nme].style.setProperty("font-size", ``);
      }
    }
  }

  function getWidth() {
    let chars = "mmmmmmmmmmwwwwwwwwwwlli";
    let p = document.createElement("p");
    p.classList.add("blocklyText", "saWidthTestString");
    p.style.opacity = "0";
    p.innerHTML = chars;
    p.style.letterSpacing = 0;
    p.style.position = "absolute";
    document.body.appendChild(p);
    let w = p.clientWidth;
    p.remove();
    return w / chars.length;
  }

  async function calcSize(font) {
    let styl = Object.assign(document.createElement("style"), {
      textContent: `.saWidthTestString { font-family: ${font} !important }`,
    });
    document.head.appendChild(styl);
    await new Promise((resolve) => {
      styl.addEventListener("load", resolve);
    });
    let width = getWidth();
    let percent = defWidth / width;
    styl.remove();

    return percent;
  }
}
