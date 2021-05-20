export default async function ({ addon, console }) {
  let enabled = true; //Addon is enabled

  addon.self.addEventListener("disabled", () => (enabled = false));
  addon.self.addEventListener("reenabled", () => console.log((enabled = true)));

  while (true) {
    let ignore = false; //Have files already been changed?

    let input = await addon.tab.waitForElement('input[type="file"][accept*=".svg"]', {
      markAsSeen: true,
    }); //Wait for the next image file input

    input.addEventListener(
      "change",
      (e) => {
        if (!enabled) return;
        if (!ignore) {
          e.stopPropagation(); //Prevent Scratch from seeing the event so that we can process the images first
          ignore = true;
          onchange(e);
        }
        //Files have not been changed yet...
        else ignore = false;
      },
      { capture: true }
    );
  }

  async function onchange(e) {
    let el = e.target;
    let files = Array.from(el.files);
    let processed = new Array();

    for (let file of files) {
      if (file.type.includes("svg")) {
        //The file is already a svg, we should not change it...
        processed.push(file);
        continue;
      }

      let blob = await new Promise((resolve) => {
        //Get the Blob data url for the image so that we can add it to the svg
        let reader = new FileReader();
        reader.addEventListener("load", () => resolve(reader.result));
        reader.readAsDataURL(file);
      });

      let i = new Image(); //New image to get the image's size
      i.src = blob;
      await new Promise((resolve) => {
        i.onload = resolve;
      });
      
      if (i.width <= 480 && i.height <= 360) {
        processed.push(file);
        continue;
      }
      
      let dim = { width: i.width, height: i.height };

      if (dim.width / dim.height === 480 / 360) {
        dim.width = 480;
        dim.height = 360;
      } else if ((dim.width / dim.height) * 360 <= 360) {
        dim.width = (dim.width / dim.height) * 360;
        dim.height = 360;
      } else {
        dim.height = (dim.height / dim.width) * 480;
        dim.width = 480;
      }

      processed.push(
        new File( //Create the svg file
          [
            `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewbox="0,0,${dim.width},${dim.height}" width="${dim.width}" height="${dim.height}">
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
                width="${dim.width}"
                height="${dim.height}"
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

    el.files = arrayToFileList(processed); //Convert processed image array to a FileList, which is not constructible.

    el.dispatchEvent(new e.constructor(e.type, e)); //Start a new, duplicate, event, but allow scratch to receive it this time.
  }

  function arrayToFileList(arr) {
    let filelist = new DataTransfer(); //This "creates" a FileList that we can add files to
    for (let file of arr) {
      filelist.items.add(file);
    }
    return filelist.files; //Completed FileList
  }
}
