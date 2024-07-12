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

      items.splice(insertBeforeIndex, 0, {
        enabled: !!svgchild?.childNodes?.length,
        text: msg("saveAll"),
        callback: () => {
          exportPopup();
        },
        separator: true,
      });

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

      items.splice(insertBeforeIndex, 0, {
        enabled: true,
        text: msg("save"),
        callback: () => {
          exportPopup(block);
        },
        separator: true,
      });

      return items;
    },
    { blocks: true }
  );

  async function exportPopup(block) {
    const modal = addon.tab.createModal(msg("modalTitle"), {
      isOpen: true,
      useEditorClasses: true,
    });

    const { backdrop, container, content, closeButton } = modal;
    let remove = modal.remove;
    container.classList.add("sa-export-container");
    content.classList.add("sa-export-content");

    backdrop.addEventListener("click", remove);
    closeButton.addEventListener("click", remove);

    const imageContainer = document.createElement("div");
    imageContainer.classList.add("sa-export-image-container");
    const image = document.createElement("img");
    image.classList.add("sa-export-image");
    image.src = await exportBlock(true, false, true, block);

    image.onload = function () {
      const aspect = image.width / image.height;
      if (aspect >= 1) image.classList.add("wide");
      else image.classList.add("tall");
    };

    imageContainer.append(image);
    content.append(imageContainer);

    const buttonContainer = document.createElement("div");
    buttonContainer.className = addon.tab.scratchClass("prompt_button-row", { others: "sa-export-button-container" });

    const copyButton = document.createElement("button");
    const svgButton = document.createElement("button");
    const pngButton = document.createElement("button");

    copyButton.className = addon.tab.scratchClass("prompt_ok-button", { others: "sa-export-copy-button" });
    copyButton.textContent = msg("clipboard");
    svgButton.className = addon.tab.scratchClass("prompt_ok-button", { others: "sa-export-svg-button" });
    svgButton.textContent = msg("svg");
    pngButton.className = addon.tab.scratchClass("prompt_ok-button", { others: "sa-export-png-button" });
    pngButton.textContent = msg("png");

    buttonContainer.append(copyButton);
    buttonContainer.append(svgButton);
    buttonContainer.append(pngButton);

    content.append(buttonContainer);

    function handleCopyClick() {
      exportBlock(true, true, false, block);
      remove();
    }
    function handleSVGClick() {
      exportBlock(false, false, false, block);
      remove();
    }
    function handlePNGClick() {
      exportBlock(true, false, false, block);
      remove();
    }

    copyButton.addEventListener("click", handleCopyClick);
    svgButton.addEventListener("click", handleSVGClick);
    pngButton.addEventListener("click", handlePNGClick);
  }

  /**
   *
   * @param {boolean} isExportPNG - Export as a PNG file
   * @param {boolean} copyToClipboard - Copy to clipboard
   * @param {boolean} returnData - Return the imageURL
   * @param {block object} block - The block object returned by createBlockContextMenu
   * @returns {dataURL} - DataURL of the image
   */
  async function exportBlock(isExportPNG, copyToClipboard, returnData, block) {
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
      return exportPNG(svg, copyToClipboard, returnData);
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
    }
    if (dataShapes === "hat") {
      translateY = 16; // for Events
      if (enabledAddons.includes("cat-blocks")) {
        translateY += 16; // for cat ears
      }
    }
    svgchild.setAttribute("transform", `translate(0,${scale * translateY}) scale(${scale})`);
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

    svgchild.childNodes.forEach((g) => {
      let x = g.getAttribute("transform").match(/translate\((.*?),(.*?)\)/)[1] || 0;
      let y = g.getAttribute("transform").match(/translate\((.*?),(.*?)\)/)[2] || 0;
      xArr.push(x * (isExportPNG ? 2 : 1));
      yArr.push(y * (isExportPNG ? 2 : 1));
    });

    svgchild.setAttribute(
      "transform",
      `translate(${-Math.min(...xArr)},${-Math.min(...yArr) + 18 * (isExportPNG ? 2 : 1)}) ${
        isExportPNG ? "scale(2)" : ""
      }`
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

  function exportPNG(svg, copy, returnData) {
    return new Promise((resolve, reject) => {
      const serializer = new XMLSerializer();

      const iframe = document.createElement("iframe");
      document.body.append(iframe);
      iframe.contentDocument.write(serializer.serializeToString(svg));
      let { width, height } = iframe.contentDocument.body.querySelector("svg g").getBoundingClientRect();
      svg.setAttribute("width", width + "px");
      svg.setAttribute("height", height + "px");

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

        if (!returnData) {
          if (copy) {
            addon.tab.copyImage(dataURL).catch((e) => console.error(`Image could not be copied: ${e}`));
          } else {
            link.download = `block_${timestamp}.png`;
            link.href = dataURL;
            link.click();
          }
        }

        resolve(dataURL);

        iframe.remove();
      };
      img.onerror = reject;
    });
  }
}
