export default async function ({ addon, console }) {
  // Fixes "x", "y", and "dominant-baseline" being ignored by Scratch, "span" causing offset
  function fixEditorSVG(element) {
    const svg = element.cloneNode(true);

    // This fixes the previous issue of SVGs imported from Affinity Designer
    if (svg.height.baseVal.valueAsString === "100%" && svg.width.baseVal.valueAsString === "100%") {
      svg.removeAttribute("height");
      svg.removeAttribute("width");
    }

    if (addon.settings.get("removeUnsupported")) {
      // This iframe is needed to correct "dominant-baseline"
      const iframe = document.createElement("iframe");
      iframe.setAttribute("src", "about:blank");
      document.body.append(iframe);
      iframe.contentDocument.body.appendChild(svg);

      for (const textElement of svg.getElementsByTagName("text")) {
        let x = Number.parseFloat(textElement.getAttribute("x") ?? "0");
        let y = Number.parseFloat(textElement.getAttribute("y") ?? "0");

        // Appends "tspan" instead of Scratch
        const innerTextElement = textElement.firstChild;
        if (innerTextElement.tagName === undefined) {
          const innerTextSpan = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
          innerTextSpan.appendChild(innerTextElement);
          textElement.appendChild(innerTextSpan);
        }

        // Accounts for "dominant-baseline" removal
        const baselineAdjust = textElement.cloneNode(true);
        textElement.after(baselineAdjust);
        baselineAdjust.style.dominantBaseline = "auto";
        const difference = textElement.getBoundingClientRect().top - baselineAdjust.getBoundingClientRect().top;
        textElement.style.dominantBaseline = "auto";
        baselineAdjust.remove();

        let transform = textElement.getAttribute("transform") ?? "";
        transform += ` translate(${x}, ${y + difference})`;
        textElement.setAttribute("transform", transform);
        textElement.setAttribute("x", "0");
        textElement.setAttribute("y", "0");
      }

      // Fixes scratchblocks images removal
      for (const useElement of svg.querySelectorAll("use")) {
        const referElement = svg.querySelector(useElement.getAttribute("href")).cloneNode(true);
        useElement.removeAttribute("href");
        for (let useAttribute of useElement.attributes) {
          referElement.setAttribute(useAttribute.name, useAttribute.value);
        }
        useElement.replaceWith(referElement);
        useElement.remove();
      }

      iframe.remove();
    }
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

            svgElement.replaceWith(fixEditorSVG(svgElement));
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
