export default async function ({ addon, console, safeMsg: m }) {
  let mode = addon.settings.get("fitting");

  addon.settings.addEventListener("change", () => {
    mode = addon.settings.get("fitting");
  });

  //Returns html code for an item in the selection lists, complete with tooltip.
  let html = (id, right) => `<div id="${id}">
  <button aria-label="Upload Costume" class="${addon.tab.scratchClass("action-menu_button")} ${addon.tab.scratchClass(
    "action-menu_more-button"
  )} sa-better-img-uploads-btn" data-for="sa-${id}-HD Upload" data-tip="${m("upload")}" currentitem="false">
    <img class="${addon.tab.scratchClass("action-menu_more-icon")} sa-better-img-uploader" draggable="false" src="${
    addon.self.dir + "/icon.svg"
  }" height="10", width="10">
     <input accept=".svg, .png, .bmp, .jpg, .jpeg" class="${addon.tab.scratchClass(
       "action-menu_file-input"
     )}" multiple="" type="file">
  </button>
  <div class="__react_component_tooltip place-${right ? "left" : "right"} type-dark ${addon.tab.scratchClass(
    "action-menu_tooltip"
  )} sa-better-img-uploads-tooltip" id="sa-${id}-HD Upload" data-id="tooltip" >${m("upload")}</div>
</div>`;

  while (true) {
    //Catch all upload menus as they are created
    let menu = await addon.tab.waitForElement(
      '[class*="sprite-selector_sprite-selector_"] [class*="action-menu_more-buttons_"], #react-tabs-3 [class*="action-menu_more-buttons_"]',
      { markAsSeen: true }
    );
    let button = menu.parentElement.previousElementSibling.previousElementSibling; //The base button that the popup menu is from

    let id = button.getAttribute("aria-label").replace(/\s+/g, "_");

    let isRight = //Is it on the right side of the screen?
      button.parentElement.classList.contains(addon.tab.scratchClass("sprite-selector_add-button")) ||
      button.parentElement.classList.contains(addon.tab.scratchClass("stage-selector_add-button"));

    if (isRight) {
      id += "_right";
    }

    menu.insertAdjacentHTML("afterbegin", html(id, isRight));
    let menuItem = document.getElementById(id);

    menuItem.querySelector("button").addEventListener("click", (e) => {
      menuItem.querySelector("button > input").files = new FileList(); //Empty the input to make sure the change event fires even if the same file was uploaded.
      menuItem.querySelector("button > input").click();
    });

    menuItem.querySelector("button > input").addEventListener("change", (e) => {
      onchange(e, id);
    });

    let observer = new MutationObserver(() => doresize(id, menu, menuItem, isRight));

    observer.observe(menu, { attributes: true, subtree: true });

    function doresize(id, menu, menuItem, isRight) {
      let rect = menuItem.getBoundingClientRect();
      menuItem.querySelector(`.sa-better-img-uploads-tooltip`).style.top = rect.top + 2 + "px";
      menuItem.querySelector(`.sa-better-img-uploads-tooltip`).style[isRight ? "right" : "left"] = isRight
        ? window.innerWidth - rect.right + rect.width + 10 + "px"
        : rect.left + rect.width + "px";
    }
  }

  async function onchange(e, id) {
    let iD = id; //Save the id, not sure if this is really necessary?
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

      if (mode === "fit") {
        //Make sure the image fits completely in the stage
        dim = getResizedWidthHeight(dim.width, dim.height);
      } else if (mode === "fill") {
        //Fill the stage with the image
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
      } //Otherwise just leave the image the same size

      function getResizedWidthHeight(oldWidth, oldHeight) {
        const STAGE_WIDTH = 479;
        const STAGE_HEIGHT = 360;
        const STAGE_RATIO = STAGE_WIDTH / STAGE_HEIGHT;

        // If both dimensions are smaller than or equal to corresponding stage dimension,
        // double both dimensions
        if (oldWidth <= STAGE_WIDTH && oldHeight <= STAGE_HEIGHT) {
          return { width: oldWidth, height: oldHeight };
        }

        // If neither dimension is larger than 2x corresponding stage dimension,
        // this is an in-between image, return it as is
        if (oldWidth <= STAGE_WIDTH && oldHeight <= STAGE_HEIGHT) {
          return { width: oldWidth, height: oldHeight };
        }

        const imageRatio = oldWidth / oldHeight;
        // Otherwise, figure out how to resize
        if (imageRatio >= STAGE_RATIO) {
          // Wide Image
          return {
            width: STAGE_WIDTH,
            height: Math.floor(STAGE_WIDTH / imageRatio),
          };
        }
        // In this case we have either:
        // - A wide image, but not with as big a ratio between width and height,
        // making it so that fitting the width to double stage size would leave
        // the height too big to fit in double the stage height
        // - A square image that's still larger than the double at least
        // one of the stage dimensions, so pick the smaller of the two dimensions (to fit)
        // - A tall image
        // In any of these cases, resize the image to fit the height to double the stage height
        return {
          width: Math.floor(STAGE_HEIGHT * imageRatio),
          height: STAGE_HEIGHT,
        };
      }

      processed.push(
        new File( //Create the svg file
          [
            `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewbox="0,0,${dim.width},${dim.height}" width="${dim.width}" height="${dim.height}">
        <g>
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

    (el = document.getElementById(iD).nextElementSibling.querySelector("input")).files = new FileList(processed); //Convert processed image array to a FileList, which is not normally constructible.

    el.dispatchEvent(new e.constructor(e.type, e)); //Start a new, duplicate, event, but allow scratch to receive it this time.
  }

  function FileList(arr = []) {
    //File list constructor. Does not need the `new` keyword, but it is easier to read
    let filelist = new DataTransfer(); //This "creates" a FileList that we can add files to
    for (let file of arr) {
      filelist.items.add(file);
    }
    return filelist.files; //Completed FileList
  }
}
