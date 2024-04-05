export default async function ({ addon, console }) {
  // Accounts for Scratch editor
  function toEditorSVG(document) {
    const svg = document.getElementsByTagName("svg")[0];
    const svgWindow = document.defaultView;
    var translate, x, y, size;

    for (var textElement of svg.getElementsByTagName("text")) {
      try {
        translate = textElement.getAttribute("transform").split("(")[1].split(")")[0].split(", ");
      } catch {
        translate = ["0", "0"];
      }
      translate[0] = Number.parseFloat(translate[0]);
      translate[1] = Number.parseFloat(translate[1]);

      try {
        x = textElement.getAttribute("x");
      } catch {
        x = "0";
      }
      x = Number.parseFloat(x);

      try {
        y = textElement.getAttribute("y");
      } catch {
        y = "0";
      }
      y = Number.parseFloat(y);

      size = svgWindow.getComputedStyle(textElement).getPropertyValue("font-size");
      size = Number.parseFloat(size.split("px")[0]);

      textElement.setAttribute("transform", `translate(${translate[0] + x}, ${translate[1] + y - size}) `);
      textElement.setAttribute("x", "0");
      textElement.setAttribute("y", "0");
    }
  }

  toEditorSVG(document);

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

            toEditorSVG(xmlDocument);

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
