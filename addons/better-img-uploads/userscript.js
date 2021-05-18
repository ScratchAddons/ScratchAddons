export default async function ({ addon, console }) {
  let enabled = true;
  addon.self.addEventListener("disabled", () => (enabled = false));
  addon.self.addEventListener("reenabled", () => console.log((enabled = true)));
  while (true) {
    let ignore = false;

    let input = await addon.tab.waitForElement('input[type="file"][accept*=".svg"]', {
      markAsSeen: true,
    });

    input.addEventListener(
      "change",
      (e) => {
        if (!enabled) return;
        if (!ignore) (ignore = true) && onchange(e);
        else ignore = false;
      },
      true
    );
  }

  async function onchange(e) {
    e.stopPropagation();

    let el = e.target;
    let files = Array.from(el.files);
    let processed = new Array();

    for (let file of files) {
      let blob = await new Promise((resolve) => {
        let reader = new FileReader();
        reader.addEventListener("load", () => resolve(reader.result));
        reader.readAsDataURL(file);
      });

      if (file.type.includes("svg")) {
        processed.push(file);
        continue;
      }

      let i = new Image();
      i.src = blob;
      await new Promise((resolve) => {
        i.onload = resolve;
      });

      processed.push(
        new File(
          [
            `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewbox="0,0,${i.width},${i.height}" width="${i.width}" height="${i.height}">
        <g transform="translate(0,0)">
          <g
              data-paper-data='{"isPaintingLayer":true}'
              fill="none"
              fill-rule="nonzero"
              stroke="none"
              stroke-width="0.5"
              stroke-linecap="butt"
              stroke-linejoin="miter"
              stroke-miterlimit="10"
              stroke-dasharray=""
              stroke-dashoffset="0"
              style="mix-blend-mode: normal;"
          >
            <image
                href="${i.src}"
                width="${i.width}"
                height="${i.height}"
                xlink:href="${blob}"
            />
          </g>
        </g>
      </svg>`,
          ],
          `${file.name.replace(/(.*)\..*/, "$1")}.svg`,
          {
            type: "image/svg+xml",
          }
        )
      );
    }

    el.files = arrayToFileList(processed);

    el.dispatchEvent(e);
  }

  function arrayToFileList(arr) {
    let filelist = new ClipboardEvent("").clipboardData || new DataTransfer();
    for (let file of arr) {
      filelist.items.add(file);
    }
    return filelist.files;
  }
}
