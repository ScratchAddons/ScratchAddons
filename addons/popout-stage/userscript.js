import {
  getIntervalOwner,
  polluteRuntimeStart,
  restartStepInterval,
  setIntervalOwner,
} from "../60fps/vm-stepping-interval-module.js";

export default async function ({ addon, console, msg }) {
  function getNewTab() {
    const newWindow = window.open("");

    // The <canvas> is streamed into a <video> element
    const video = Object.assign(document.createElement("video"), {
      playsInline: true,
      autoplay: true,
      muted: true,
    });

    // TODO: style new tab similarly to the fullscreen view? How to handle resolution?
    video.style.height = "360px";
    video.style.width = "480px";

    newWindow.document.body.appendChild(video);

    const title = document.createElement("title");
    title.textContent = "Project player"; // TODO
    // Favicon TODO
    newWindow.document.head.appendChild(title);

    return { newWindow, video };
  }

  const vm = addon.tab.traps.vm;
  polluteRuntimeStart(vm);

  // Type `p()` into the console to use
  window.p = () => {
    const { newWindow: $window, video: $videoElem } = getNewTab();

    setIntervalOwner($window);
    restartStepInterval(vm);

    const checkPotentialOwnerChange = () => {
      const currentOwner = getIntervalOwner();
      let changedOwner = false;

      if (document.hidden && !$window.document.hidden) {
        if (currentOwner !== $window) changedOwner = true;
        setIntervalOwner($window);
      } else {
        if (currentOwner !== window) changedOwner = true;
        setIntervalOwner(window);
      }

      if (changedOwner) {
        console.log("Changed owner to ", getIntervalOwner() === window ? "self" : "$window");
        restartStepInterval(vm);
      }
    };

    document.addEventListener("visibilitychange", checkPotentialOwnerChange);
    $window.document.addEventListener("visibilitychange", checkPotentialOwnerChange);

    const canvas = document.querySelector("canvas"); // The project stage canvas
    const stream = canvas.captureStream(30);
    $videoElem.srcObject = stream;

    // Mouse, touch, and wheel events
    // https://github.com/scratchfoundation/scratch-gui/blob/9198878ad3f1ce31e0fdaa819b9951a3469614a7/src/containers/stage.jsx#L121-L138
    $videoElem.addEventListener("mousedown", (e) => {
      canvas.dispatchEvent(new MouseEvent("mousedown", e));
    });
    $videoElem.addEventListener("mouseup", (e) => {
      canvas.dispatchEvent(new MouseEvent("mouseup", e));
    });
    // (TODO other events)
  };
}
