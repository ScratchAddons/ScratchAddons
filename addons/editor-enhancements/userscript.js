// Welcome to Editor Enhancements code!
// Code was written by Norbiros
//
// If you found any bugs, or you want change anything
// create issue on Scratch Addon github (or create PR)!

export default async function ({ addon, global, console, msg }) {
  const vm = addon.tab.traps.vm;

  //This is code for creating button that can hide stage for user
  if (addon.settings.get("hideStage")) {
    if (addon.tab.redux.state.scratchGui.mode.isPlayerOnly) {
      return;
    }
    let stageHidden = false;
    let event = new CustomEvent("resize");

    //Creating element and adding it to controls container
    const hideStageButton = document.createElement("div");
    hideStageButton.className = "sa-editorenhancements-movebutton";
    const hideSceneImage = document.createElement("img");
    hideSceneImage.src = addon.self.dir + "/icons/move-icon.svg";
    hideSceneImage.className = addon.tab.scratchClass("stage-header_stage-button");
    hideStageButton.appendChild(hideSceneImage);
    document.querySelector("[class*='controls_controls-container']").appendChild(hideStageButton);

    //Hide stage and change things in style
    hideStageButton.addEventListener("click", function () {
      if (stageHidden) {
        stageHidden = false;
        hideStageButton.classList.remove("sa-editorenhancements-movebutton-rotate");
        document.querySelector("[class*='controls_controls-container']").appendChild(hideStageButton);
        document.querySelector("[class*='gui_stage-and-target-wrapper_']").style.display = "flex";
        vm.runtime.stageWidth = 480;
      } else {
        stageHidden = true;
        hideStageButton.classList.add("sa-editorenhancements-movebutton-rotate");
        document.body.appendChild(hideStageButton);
        document.querySelector("[class*='gui_stage-and-target-wrapper_']").style.display = "none";
        vm.runtime.stageWidth = 0;
      }
      //Fake event for changing size of screen
      window.dispatchEvent(event);
    });
  }

  //This is code for new button for taking screenshot of scene
  if (addon.settings.get("takePhoto")) {
    var resultImage;
    let canvas = document.getElementsByTagName("canvas")[0];

    //Thanks to Debbuger Addon for nice code of creating element!
    const photoButtonOuter = document.createElement("div");
    photoButtonOuter.className = "sa-editorenhancements-photobutton";
    const photoButton = document.createElement("div");
    photoButton.className = addon.tab.scratchClass("button_outlined-button", "stage-header_stage-button");
    const photoButtonContent = document.createElement("div");
    photoButtonContent.className = addon.tab.scratchClass("button_content");
    const photoButtonImage = document.createElement("img");
    photoButtonImage.className = addon.tab.scratchClass("stage-header_stage-button-icon");
    photoButtonImage.draggable = false;
    photoButtonImage.src = addon.self.dir + "/icons/photo-icon.svg";
    photoButtonContent.appendChild(photoButtonImage);
    photoButton.appendChild(photoButtonContent);
    photoButtonOuter.appendChild(photoButton);
    addon.tab.appendToSharedSpace({ space: "stageHeader", element: photoButtonOuter, order: 1 });

    // This is function that saves current image from canvas.
    photoButton.addEventListener("click", function () {
      vm.renderer.requestSnapshot((dataURL) => {
        if (typeof dataURL == "undefined") {
          return;
        }
        resultImage = dataURL;
      });
      var tempLink = document.createElement("a");
      tempLink.download = "scratch-screenshot.jpg";
      tempLink.href = resultImage;
      tempLink.click();
    });
  }

  // This function detect on which sprite you clicked, then go to origin element of sprite, after that go back to sprite name.
  if (addon.settings.get("moveSpriteToFront")) {
    let spriteList = document.getElementsByClassName("sprite-selector_items-wrapper_4bcOj box_box_2jjDp");
    spriteList[0].addEventListener(
      "click",
      function (e) {
        if (e.shiftKey) {
          let parentDiv = event.target.closest(".sprite-selector_sprite-wrapper_1C5Mq");
          let name = parentDiv.querySelector(".sprite-selector-item_sprite-name_1PXjh").innerText;
          vm.runtime.getSpriteTargetByName(name).goToFront();
          e.stopPropagation(); //Disable opening this sprite in editor.
        }
      },
      false
    );
  }

  if (addon.settings.get("sizeInput")) {
    let inputNumber = document.getElementsByClassName("input_input-form_l9eYg input_input-small_2qj1C")[2];
    inputNumber.style.position = "relative";

    //This function make changing size in input working dynamically!
    inputNumber.oninput = function () {
      document.getElementById("input-size").value = inputNumber.value;
      vm.editingTarget.setSize(inputNumber.value);
    };

    //When element is clicked, open menu
    inputNumber.addEventListener("focus", (e) => {
      openMenu();
    });

    inputNumber.addEventListener("blur", (e) => {
      setTimeout(function () {
        if (
          document.activeElement.id == "sa-input-size" ||
          document.activeElement.classList.contains("sa-popover-size")
        ) {
          return;
        }
        closeMenu();
      }, 1);
    });

    function openMenu() {
      document.getElementsByClassName("gui_flex-wrapper_uXHkj box_box_2jjDp")[0].style.overflow = "hidden";

      //Create element
      let popoverElement = document.createElement("div");
      popoverElement.classList.add("sa-popover-size");
      let inputElement = document.createElement("input");

      //Create input
      popoverElement.appendChild(inputElement);
      inputElement.type = "range";
      inputElement.id = "sa-input-size";
      inputElement.value = inputNumber.value;

      inputElement.oninput = function () {
        inputNumber.value = inputElement.value;
        vm.editingTarget.setSize(inputElement.value);
      };

      inputElement.addEventListener("blur", (e) => {
        closeMenu();
      });

      //Creating polygons in JS is strange...
      let svgElement = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      let polygonElement = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
      svgElement.appendChild(polygonElement);
      polygonElement.setAttribute("points", "0,0 7,7, 14,0");
      svgElement.classList.add("svg");
      popoverElement.appendChild(svgElement);

      document.getElementsByClassName("sprite-info_sprite-info_3EyZh box_box_2jjDp")[0].appendChild(popoverElement);
    }

    function closeMenu() {
      document.getElementsByClassName("sa-popover-size")[0].remove();
    }
  }

  //Function that "locks" mouse
  if (addon.settings.get("lockMouse")) {
    //Create element for showing if mouse is locked
    const mouseLockedSpan = document.createElement("span");
    const mouseLockedDiv = document.createElement("div");
    mouseLockedDiv.innerText = "";
    mouseLockedDiv.classList.add("mouselock-info");
    mouseLockedDiv.append(mouseLockedSpan);

    addon.tab.appendToSharedSpace({ space: "afterStopButton", element: mouseLockedDiv, order: 1 });
    //We need to save that data (I tried with 4 variables, but it have bugs)
    let mouseLocked = false;
    let saveMousePosition = false;
    let savedPositionY;
    let savedPositionX;
    let isMouseClicked = false;

    document.addEventListener("mousedown", (e) => {
      if (!mouseLocked) {
        return;
      }
      setTimeout(function () {
        let event = new CustomEvent("mousemove");
        window.dispatchEvent(event);
        console.log("move2");
      }, 2000);
    });

    document.body.onkeyup = function (e) {
      if (e.key !== "Escape") {
        return;
      }
      //Turning off and on this function
      if (mouseLocked) {
        mouseLocked = false;
        mouseLockedSpan.innerText = "";
        mouseLockedDiv.classList.remove("mouselock-locked");
        vm.runtime.ioDevices.mouse._isDown = false;
      } else {
        mouseLocked = true;
        saveMousePosition = true;
        mouseLockedSpan.innerText = msg("mouse-lock");
        mouseLockedDiv.classList.add("mouselock-locked");
        isMouseClicked = vm.runtime.ioDevices.mouse._isDown;
      }
    };

    document.addEventListener("mousemove", (e) => {
      if (saveMousePosition) {
        savedPositionX = vm.runtime.ioDevices.mouse.__scratchX;
        savedPositionY = vm.runtime.ioDevices.mouse.__scratchY;
        saveMousePosition = false;
      }
      if (mouseLocked) {
        //Faking scratch data
        console.log("move");
        vm.runtime.ioDevices.mouse.__scratchX = savedPositionX;
        vm.runtime.ioDevices.mouse.__scratchY = savedPositionY;
        vm.runtime.ioDevices.mouse._isDown = isMouseClicked;
      }
    });
  }
}
