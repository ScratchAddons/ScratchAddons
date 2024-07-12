export default async function ({ addon, console, msg }) {
  const Blockly = await addon.tab.traps.getBlockly();

  function makeStyle() {
    let style = document.createElement("style");
    style.textContent = `
    .blocklyText {
        fill: ${Blockly.Colours.text};
        font-family: "Helvetica Neue", Helvetica, sans-serif;
        font-size: 12pt;
        font-weight: 500;
    }
    .blocklyNonEditableText>text, .blocklyEditableText>text {
        fill: ${Blockly.Colours.textFieldText};
    }
    .blocklyDropdownText {
        fill: ${Blockly.Colours.text} !important;
    }
    `;
    for (let userstyle of document.querySelectorAll(".scratch-addons-style[data-addon-id='editor-theme3']")) {
      if (userstyle.disabled) continue;
      style.textContent += userstyle.textContent;
    }
    return style;
  }

  function setCSSVars(element) {
    for (let property of document.documentElement.style) {
      if (property.startsWith("--editorTheme3-"))
        element.style.setProperty(property, document.documentElement.style.getPropertyValue(property));
    }
  }

  let exSVG = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  exSVG.setAttribute("xmlns:html", "http://www.w3.org/1999/xhtml");
  exSVG.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
  exSVG.setAttribute("version", "1.1");

  const enabledAddons = await addon.self.getEnabledAddons("codeEditor");

  addon.tab.createBlockContextMenu(
    (items) => {
      if (addon.self.disabled) return items;
      let svgchild = document.querySelector("svg.blocklySvg g.blocklyBlockCanvas");

      const pasteItemIndex = items.findIndex((obj) => obj._isDevtoolsFirstItem);
      const insertBeforeIndex =
        pasteItemIndex !== -1
          ? // If "paste" button exists, add own items before it
            pasteItemIndex
          : // If there's no such button, insert at end
            items.length;

      items.splice(
        insertBeforeIndex,
        0,
        {
          enabled: !!svgchild?.childNodes?.length,
          text: msg("export_all_to_SVG"),
          callback: () => {
            exportBlock(false);
          },
          separator: true,
        },
        {
          enabled: !!svgchild?.childNodes?.length,
          text: msg("export_all_to_PNG"),
          callback: () => {
            exportBlock(true);
          },
          separator: false,
        }
      );

      return items;
    },
    { workspace: true }
  );
  addon.tab.createBlockContextMenu(
    (items, block) => {
      if (addon.self.disabled) return items;
      const makeSpaceItemIndex = items.findIndex((obj) => obj._isDevtoolsFirstItem);
      const insertBeforeIndex =
        makeSpaceItemIndex !== -1
          ? // If "make space" button exists, add own items before it
            makeSpaceItemIndex
          : // If there's no such button, insert at end
            items.length;

      items.splice(
        insertBeforeIndex,
        0,
        {
          enabled: true,
          text: msg("export_selected_to_SVG"),
          callback: () => {
            exportBlock(false, block);
          },
          separator: true,
        },
        {
          enabled: true,
          text: msg("export_selected_to_PNG"),
          callback: () => {
            exportBlock(true, block);
          },
          separator: false,
        }
      );

      return items;
    },
    { blocks: true }
  );

  async function exportBlock(isExportPNG, block) {
    let svg;
    if (block) {
      svg = selectedBlocks(isExportPNG, block);
    } else {
      svg = allBlocks(isExportPNG);
    }
    // resolve nbsp whitespace
    svg.querySelectorAll("text").forEach((text) => {
      text.innerHTML = text.innerHTML.replace(/&nbsp;/g, " ");
    });

    // replace external images with data URIs
    await Promise.all(
      Array.from(svg.querySelectorAll("image")).map(async (item) => {
        const iconUrl = item.getAttribute("xlink:href");
        if (iconUrl.startsWith("data:")) return;
        const blob = await (await fetch(iconUrl)).blob();
        const reader = new FileReader();
        const dataUri = await new Promise((resolve) => {
          reader.addEventListener("load", () => resolve(reader.result));
          reader.readAsDataURL(blob);
        });
        item.setAttribute("xlink:href", dataUri);
      })
    );
    if (!isExportPNG) {
      exportData(new XMLSerializer().serializeToString(svg));
    } else {
      exportPNG(svg);
    }
  }

  function selectedBlocks(isExportPNG, block) {
    let svg = exSVG.cloneNode();

    let svgchild = block.svgGroup_;
    svgchild = svgchild.cloneNode(true);
    let dataShapes = svgchild.getAttribute("data-shapes");
    let translateY = 0; // blocks no hat
    const scale = isExportPNG ? 2 : 1;
    if (dataShapes === "c-block c-1 hat") {
      translateY = 20; // for My block
      if (enabledAddons.includes("cat-blocks")) {
        translateY += 11; // for cat ears, why 11? I dont know
      }
    }
    if (dataShapes === "hat") {
      translateY = 16; // for Events
      if (enabledAddons.includes("cat-blocks")) {
        translateY += 15; // for cat ears
      }
    }

    translateY += 1;
    svgchild.setAttribute("transform", `translate(${scale},${scale * translateY}) scale(${scale})`);
    setCSSVars(svg);
    svg.append(makeStyle());
    svg.append(svgchild);
    return svg;
  }

  function allBlocks(isExportPNG) {
    let svg = exSVG.cloneNode();

    let svgchild = document.querySelector("svg.blocklySvg g.blocklyBlockCanvas");
    svgchild = svgchild.cloneNode(true);

    let xArr = [];
    let yArr = [];

    const scale = isExportPNG ? 2 : 1;

    svgchild.childNodes.forEach((g, i) => {
      let x = g.getAttribute("transform").match(/translate\((.*?),(.*?)\)/)[1] || 0;
      let y = g.getAttribute("transform").match(/translate\((.*?),(.*?)\)/)[2] || 0;

      let dataShapes = g.getAttribute("data-shapes");

      // Jazza here: do not ask me why these numbers work. I do not know.
      if (dataShapes === "c-block c-1 hat") {
        y -= 20;
        if (enabledAddons.includes("cat-blocks")) {
          y -= 11;
        }
      }
      if (dataShapes === "hat") {
        y -= 16;
        if (enabledAddons.includes("cat-blocks")) {
          y -= 15;
        }
      }

      xArr.push(x * scale);
      yArr.push(y * scale);
    });

    svgchild.setAttribute(
      "transform",
      `translate(${-Math.min(...xArr) + scale},${-Math.min(...yArr) + scale}) scale(${scale})`
    );
    setCSSVars(svg);
    svg.append(makeStyle());
    svg.append(svgchild);
    return svg;
  }

  function exportData(text) {
    const saveLink = document.createElement("a");
    document.body.appendChild(saveLink);

    const data = new Blob([text], { type: "text" });
    const url = window.URL.createObjectURL(data);
    saveLink.href = url;

    // File name: project-DATE-TIME
    const date = new Date();
    const timestamp = `${date.toLocaleDateString()}-${date.toLocaleTimeString()}`;
    saveLink.download = `block_${timestamp}.svg`;
    saveLink.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(saveLink);
  }

  function exportPNG(svg) {
    const serializer = new XMLSerializer();

    const iframe = document.createElement("iframe");
    // iframe.style.display = "none"
    document.body.append(iframe);
    iframe.contentDocument.write(serializer.serializeToString(svg));
    let { width, height } = iframe.contentDocument.body.querySelector("svg g").getBoundingClientRect();
    svg.setAttribute("width", width + 4 + "px");
    svg.setAttribute("height", height + 4 + "px");

    let canvas = document.createElement("canvas");
    let ctx = canvas.getContext("2d");

    let img = document.createElement("img");

    img.setAttribute(
      "src",
      "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(serializer.serializeToString(svg))))
    );
    img.onload = function () {
      canvas.height = img.height;
      canvas.width = img.width;
      ctx.drawImage(img, 0, 0, img.width, img.height);
      // Now is done
      let dataURL = canvas.toDataURL("image/png");
      let link = document.createElement("a");
      const date = new Date();
      const timestamp = `${date.toLocaleDateString()}-${date.toLocaleTimeString()}`;

      link.download = `block_${timestamp}.png`;
      link.href = dataURL;
      link.click();
      iframe.remove();
    };
  }
}
