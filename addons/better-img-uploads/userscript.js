export default async function ({ addon, console, safeMsg: m }) {
  let mode = addon.settings.get("fitting");

  addon.settings.addEventListener("change", () => {
    mode = addon.settings.get("fitting");
  });

  let html = (id, right) => `<div id="${id}">
  <button aria-label="Upload Costume" class="${addon.tab.scratchClass("action-menu_button")} ${addon.tab.scratchClass(
    "action-menu_more-button"
  )}"" data-for="sa-${id}-HD Upload" data-tip="${m("upload")}" currentitem="false">
    <img class="${addon.tab.scratchClass("action-menu_more-icon")} sa-better-img-uploader" draggable="false" src="${
    addon.self.dir + "/icon.svg"
  }" height="10", width="10">
     <input accept=".svg, .png, .bmp, .jpg, .jpeg, .gif" class="${addon.tab.scratchClass(
       "action-menu_file-input"
     )}" multiple="" type="file">
  </button>
  <div class="__react_component_tooltip place-${right ? "left" : "right"} type-dark ${addon.tab.scratchClass(
    "action-menu_tooltip"
  )}" id="sa-${id}-HD Upload" data-id="tooltip" >${m("upload")}</div>
</div>`;

  let c = addon.tab.scratchClass("action-menu_more-buttons");

  while (true) {
    let menu = await addon.tab.waitForElement(`.${c}`, { markAsSeen: true });
    let button = menu.parentElement.previousElementSibling.previousElementSibling;

    let id = button.ariaLabel.replaceAll(" ", "_");

    if (id === "Choose_a_Sound") continue;

    let isRight =
      button.parentElement.classList.contains(addon.tab.scratchClass("sprite-selector_add-button")) ||
      button.parentElement.classList.contains(addon.tab.scratchClass("stage-selector_add-button"));

    if (isRight) {
      id += "_right";
    }

    menu.insertAdjacentHTML("afterbegin", html(id, isRight));
    let menuItem = document.getElementById(id);

    menuItem.querySelector("button").addEventListener("click", (e) => {
      menuItem.querySelector("button > input").files = new FileList();
      menuItem.querySelector("button > input").click();
    });

    menuItem.querySelector("button > input").addEventListener("change", (e) => {
      onchange(e, id);
    });
  }

  async function onchange(e, id) {
    let iD = id;
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

      let dim = { width: i.width, height: i.height };

      console.log(mode);

      if (mode === "fit") {
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
      } else if (mode === "fill") {
        dim.height = (dim.height / dim.width) * 480;
        dim.width = 480;
        if (dim.height < 360) {
          dim.width = (dim.width / dim.height) * 360;
          dim.height = 360;
        }
        if (dim.width < 480) {
          dim.height = (dim.height / dim.width) * 480;
          dim.width = 480;
        }
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

    (el = document.getElementById(iD).nextElementSibling.querySelector("input")).files = new FileList(processed); //Convert processed image array to a FileList, which is not constructible.

    el.dispatchEvent(new e.constructor(e.type, e)); //Start a new, duplicate, event, but allow scratch to receive it this time.
  }

  function FileList(arr = []) {
    let filelist = new DataTransfer(); //This "creates" a FileList that we can add files to
    for (let file of arr) {
      filelist.items.add(file);
    }
    return filelist.files; //Completed FileList
  }
}
