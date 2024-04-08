export default async function ({ addon, console }) {
  // Fixes "x", "y", and "dominant-baseline" being ignored by Scratch, "span" causing offset
  function toEditorSVG(element) {
    // This iframe is needed to correct "dominant-baseline"
    const iframe = document.createElement("iframe");
    iframe.setAttribute("src", "about:blank");
    document.body.append(iframe);

    const svg = element.cloneNode(true);
    iframe.contentDocument.body.appendChild(svg);

    var transform, translate, translateIndex, x, y, difference;
    var baselineAdjust, innerTextElement, innerTextSpan;
    for (var textElement of svg.getElementsByTagName("text")) {
      // Extracts "translate" from "transform" property
      if (textElement.hasAttribute("transform")) {
        transform = textElement.getAttribute("transform");
        translateIndex = transform.indexOf("translate");
        if (translateIndex === -1) {
          transform += "translate(0, 0)";
          translate = ["0", "0"];
        } else {
          translate = transform.slice(translateIndex, transform.indexOf(")")).split("(")[1].split(/,* /g);
          translate.push("0");
        }
      } else {
        transform = "translate(0, 0)";
        translate = ["0", "0"];
      }
      translate[0] = Number.parseFloat(translate[0]);
      translate[1] = Number.parseFloat(translate[1]);

      x = "0";
      if (textElement.hasAttribute("x")) {
        x = textElement.getAttribute("x");
      }
      x = Number.parseFloat(x);

      y = "0";
      if (textElement.hasAttribute("y")) {
        y = textElement.getAttribute("y");
      }
      y = Number.parseFloat(y);

      // Appends "tspan" instead of Scratch
      innerTextElement = textElement.firstChild;
      if (innerTextElement.tagName === undefined) {
        innerTextSpan = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
        innerTextSpan.appendChild(innerTextElement);
        textElement.appendChild(innerTextSpan);
      }

      // Accounts for "dominant-baseline" removal
      baselineAdjust = textElement.cloneNode(true);
      textElement.after(baselineAdjust);
      baselineAdjust.style.dominantBaseline = "auto";
      difference = textElement.getBoundingClientRect().top - baselineAdjust.getBoundingClientRect().top;
      textElement.style.dominantBaseline = "auto";
      baselineAdjust.remove();

      transform = transform.replace(
        /translate\((\d,?\s?)+\)/,
        `translate(${translate[0] + x}, ${translate[1] + y + difference}) `
      );
      textElement.setAttribute("transform", transform);
      textElement.setAttribute("x", "0");
      textElement.setAttribute("y", "0");
    }
    iframe.remove();
    return svg;
  }

  const originalFileReader = window.FileReader;
  window.FileReader = function () {
    const realFileReader = new originalFileReader();
    const readAsArrayBuffer = Symbol();
    realFileReader[readAsArrayBuffer] = realFileReader.readAsArrayBuffer;
    realFileReader.readAsArrayBuffer = function (file) {
      if (addon.self.disabled) return realFileReader[readAsArrayBuffer](file);
      (async () => {
        if (file.type === "image/svg+xml") {
          try {
            let text = await file.text();
            const xmlParser = new DOMParser();
            const xmlDocument = xmlParser.parseFromString(text, "text/xml");
            const svgElement = xmlDocument.children[0];
            if (
              svgElement.height.baseVal.valueAsString === "100%" &&
              svgElement.width.baseVal.valueAsString === "100%"
            ) {
              svgElement.removeAttribute("height");
              svgElement.removeAttribute("width");
              text = xmlDocument.documentElement.outerHTML;
            }

            const newSVGElement = toEditorSVG(xmlDocument.querySelector("svg"));
            svgElement.replaceWith(newSVGElement);
            text = xmlDocument.documentElement.outerHTML;

            const newFile = new File([text], file.name, {
              type: file.type,
              lastModified: file.lastModified,
            });
            realFileReader[readAsArrayBuffer](newFile);
          } catch (err) {
            console.warn(err);
            realFileReader[readAsArrayBuffer](file);
          }
        } else {
          realFileReader[readAsArrayBuffer](file);
        }
      })();
      return undefined;
    };
    return realFileReader;
  };
}
