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

  // Type `p()` into the console to use
  window.p = () => {
    const { newWindow: $window, video: $videoElem } = getNewTab();

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
