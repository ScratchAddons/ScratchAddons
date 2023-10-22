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
    const $document = $window.document;

    setIntervalOwner($window);
    restartStepInterval(vm);

    const checkPotentialOwnerChange = () => {
      const currentOwner = getIntervalOwner();
      let changedOwner = false;

      if (document.hidden && $document.hidden) {
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
    $document.addEventListener("visibilitychange", checkPotentialOwnerChange);

    const canvas = document.querySelector("canvas"); // The project stage canvas
    const stream = canvas.captureStream(30);
    $videoElem.srcObject = stream;

    function redirectEventsToMainCanvas(eventConstructor, eventNames, sourceElement, targetElement) {
      (Array.isArray(eventNames) ? eventNames : [eventNames]).forEach((eventName) => {
        sourceElement.addEventListener(eventName, (e) => {
          targetElement.dispatchEvent(new eventConstructor(eventName, e));
        });
      });
    }

    // The new tab/window cannot autoplay sound until there's user interaction
    $document.addEventListener("click", () => {
      const ctx = new $window.AudioContext();
      const dest = ctx.createMediaStreamDestination();
      const mediaStreamDestination = vm.runtime.audioEngine.audioContext.createMediaStreamDestination();
      vm.runtime.audioEngine.inputNode.connect(mediaStreamDestination);
      const audioSource = ctx.createMediaStreamSource(mediaStreamDestination.stream);
      audioSource.connect(dest);
      stream.addTrack(dest.stream.getAudioTracks()[0]);

      $videoElem.muted = false;
      // At this point, sound will come out of both tabs.
      // Ideally, it should only come out from one of them at a time!
    });

    // Mouse, touch, and wheel events
    // https://github.com/scratchfoundation/scratch-gui/blob/9198878ad3f1ce31e0fdaa819b9951a3469614a7/src/containers/stage.jsx#L121-L138
    redirectEventsToMainCanvas(MouseEvent, ["mousemove", "mouseup", "mousedown"], $videoElem, canvas);
    redirectEventsToMainCanvas(TouchEvent, ["touchmove", "touchend", "touchstart"], $videoElem, canvas);
    redirectEventsToMainCanvas(WheelEvent, "wheel", $videoElem, canvas);

    // Keyboard events
    // https://github.com/scratchfoundation/scratch-gui/blob/0c79a6bb1ee05a01cbe0ed8b32d58bfaa5c9d987/src/lib/vm-listener-hoc.jsx#L53
    redirectEventsToMainCanvas(KeyboardEvent, ["keydown", "keyup"], $document, document);
    // TODO: we need to be more careful with keyboard events, some addons typically listen to these events
    // and probably don't consider they can come from the stage in another window!
  };
}
