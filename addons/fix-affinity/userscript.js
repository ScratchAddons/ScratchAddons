export default async function ({ addon, global, console }) {
  const originalFileReader = window.FileReader;
  window.FileReader = function () {
    const realFileReader = new originalFileReader();
    realFileReader._readAsArrayBuffer = realFileReader.readAsArrayBuffer;
    realFileReader.readAsArrayBuffer = function (file) {
      window.file = file;
      (async () => {
        try {
          let text = await file.text();
          console.log(text);
          const xmlParser = new DOMParser();
          const xmlDocument = xmlParser.parseFromString(text, "text/xml");
          const svgElement = xmlDocument.children[0];
          if (svgElement.height.baseVal.valueAsString === "100%" && svgElement.width.baseVal.valueAsString === "100%") {
            svgElement.removeAttribute("height");
            svgElement.removeAttribute("width");
            text = xmlDocument.documentElement.outerHTML;
          }
          const newFile = new File([text], file.name, {
            type: file.type,
            lastModified: file.lastModified,
          });
          console.log(newFile);
          realFileReader._readAsArrayBuffer(newFile);
        } catch (err) {
          console.error(err);
          realFileReader._readAsArrayBuffer(file);
        }
      })();
    };
    return realFileReader;
  };
}
