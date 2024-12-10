// Make these global so that every addon uses the same arrays.
let views = [];
let forward = [];
export default class Utils {
  constructor(addon) {
    this.addon = addon;
    this.addon.tab.traps.getBlockly().then((blockly) => {
      this.blockly = blockly;
    });

    this.exSVG = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    this.exSVG.setAttribute("xmlns:html", "http://www.w3.org/1999/xhtml");
    this.exSVG.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
    this.exSVG.setAttribute("version", "1.1");
  }

  setCSSVars(element) {
    for (let property of document.documentElement.style) {
      if (property.startsWith("--editorTheme3-"))
        element.style.setProperty(property, document.documentElement.style.getPropertyValue(property));
    }
  }

  makeStyle() {
    let style = document.createElement("style");
    style.textContent = `
    .blocklyText {
        fill: ${this.blockly.Colours.text};
        font-family: "Helvetica Neue", Helvetica, sans-serif;
        font-size: 12pt;
        font-weight: 500;
    }
    .blocklyNonEditableText>text, .blocklyEditableText>text {
        fill: ${this.blockly.Colours.textFieldText};
    }
    .blocklyDropdownText {
        fill: ${this.blockly.Colours.text} !important;
    }
    `;
    for (let userstyle of document.querySelectorAll(".scratch-addons-style[data-addon-id='editor-theme3']")) {
      if (userstyle.disabled) continue;
      style.textContent += userstyle.textContent;
    }
    return style;
  }

  removeNonReporterChildren(svgChild) {
    // 获取所有子节点
    const children = Array.from(svgChild.childNodes);
    // 遍历子节点
    children.forEach((child) => {
      // 首先判断是否为<g />标签
      if (child.tagName === "g") {
        // 获取 data-shapes 属性
        const dataShapes = child.getAttribute("data-shapes");
        const dataArgType = child.getAttribute("data-argument-type");
        // 检查 data-shapes 属性值
        if (
          dataShapes !== "reporter round" &&
          dataShapes !== "argument round" &&
          dataShapes !== "reporter boolean" &&
          dataArgType !== "dropdown"
        ) {
          // 如果不是期望的值，从父节点中移除该子节点
          svgChild.removeChild(child);
        }
      }
    });
  }

  /**
   * A function that creates a selected block based on export type and block data.
   *
   * @param {boolean} isExportPNG - Indicates whether the export type is PNG.
   * @param {object} block - The block data to create the selected block.
   * @return {object} The created selected block as an SVG element.
   */
  selectedBlocks(block, enabledAddons, is_need_children) {
    let svg = this.exSVG.cloneNode();

    let svgchild = block.svgGroup_;
    svgchild = svgchild.cloneNode(true);
    if (!is_need_children) {
      this.removeNonReporterChildren(svgchild);
    }
    let dataShapes = svgchild.getAttribute("data-shapes");
    let translateY = 0; // blocks no hat
    const scale = 0.6;
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
    svg.append(this.makeStyle());
    svg.append(svgchild);
    return svg;
  }

  /**
   * Retrieves the SVG element for the given block. If a block is provided, it selects the selected blocks,
   * otherwise it selects all blocks. It resolves any non-breaking space whitespace in the SVG element and
   * replaces external images with data URIs.
   *
   * @param {Block} block - the block to select the SVG element for (optional)
   * @return {Promise<SVGElement>} a promise that resolves to the SVG element
   */
  getSVGElement(block, enabledAddons, is_need_children) {
    let svg;
    if (block) {
      svg = this.selectedBlocks(block, enabledAddons, is_need_children);
    }

    // resolve nbsp whitespace
    svg.querySelectorAll("text").forEach((text) => {
      text.innerHTML = text.innerHTML.replace(/&nbsp;/g, " ");
    });

    // replace external images with data URIs
    return new Promise((resolve) => {
      Promise.all(
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
      ).then(() => {
        // remove fill color
        this.removeAllFillStyles(svg);
        resolve(svg);
      });
    });
  }

  removeAllFillStyles(svg) {
    const pathElements = svg.querySelectorAll(".blocklyPath.blocklyBlockBackground");
    pathElements.forEach((pathElement) => {
      if (pathElement.style.fill) {
        pathElement.style.fill = "";
      }
    });
  }
}
