export default async function ({ addon, global, console }) {
  const barOuter = document.createElement("div");
  barOuter.className = "u-progress-bar-outer";
  const barInner = document.createElement("div");
  barInner.className = "u-progress-bar-inner";
  barOuter.appendChild(barInner);

  let totalTasks = 0;
  let finishedTasks = 0;
  let barState = "project";

  function setProgress(progress) {
    if (barState === "load-assets") {
      loadingCaption.innerText = `Loading assets (${finishedTasks}/${totalTasks}) …`;
    }
    if (progress >= 1) {
      totalTasks = 0;
      finishedTasks = 0;
    }
    barInner.style.width = progress * 100 + "%";
  }

  function updateTasks() {
    setProgress(finishedTasks / totalTasks);
  }

  function setProgressState(newState) {
    if (newState === barState) {
      return;
    }
    barState = newState;
    barOuter.dataset.state = barState;
    setProgress(0);
  }

  const loadingCaption = document.createElement("div");
  loadingCaption.innerText = "Loading project data …";
  loadingCaption.className = "u-progress-bar-caption";

  const PROJECT_REGEX = /^https:\/\/projects\.scratch\.mit\.edu\/\d+$/;
  const REMIX_REGEX = /^https:\/\/projects\.scratch\.mit\.edu\/\?is_remix=1&original_id=\d+/;
  const COPY_REGEX = /^https:\/\/projects\.scratch\.mit\.edu\/\?is_copy=1&original_id=\d+/;
  const ASSET_REGEX = /^https:\/\/assets\.scratch\.mit\.edu\//;

  // Scratch uses fetch() to download the project JSON and upload project assets.
  const originalFetch = window.fetch;
  window.fetch = (url, opts) => {
    if (typeof url === "string" && opts && typeof opts.method === "string") {
      if (opts.method.toLowerCase() === "get" && PROJECT_REGEX.test(url)) {
        // This is a request to get the project JSON.
        // Fetch does not support progress monitoring, so we use XMLHttpRequest instead.
        setProgressState("load-json");
        return new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.responseType = "blob";
          xhr.onload = () => {
            setProgress(1);
            // As we are emulating fetch(), we need to resolve with a Response object.
            resolve(
              new Response(xhr.response, {
                status: xhr.status,
                statusText: xhr.statusText,
              })
            );
          };
          xhr.onerror = () => reject(new Error("xhr failed"));
          xhr.onprogress = (e) => {
            // When the browser doesn't think the length is computable, we'll use the Content-Length header as the length.
            // TODO: Content-Length and e.total have different meanings regarding compression. Need to figure out if that's a problem.
            const length = e.lengthComputable ? e.total : +xhr.getResponseHeader("Content-Length");
            if (length) {
              setProgress(e.loaded / length);
            }
          };
          xhr.open("GET", url);
          xhr.send();
        });
      }
      if (opts.method.toLowerCase() === "post" && ASSET_REGEX.test(url)) {
        // This is a request to upload an asset.
        // Sadly, it doesn't seem to be possible to monitor upload progress on these requests, even with XHR, as the asset endpoint
        // returns 405 Method Not Allowed when an OPTIONS preflight request is made, which is required when we put listeners on `xhr.upload`
        // As a result, this won't display a useful progress bar when uploading a single large asset, but it will still display a useful
        // progress bar in the case of uploading many assets at once.
        setProgressState("save-assets");
        totalTasks++;
        updateTasks();
        return originalFetch(url, opts).then((response) => {
          finishedTasks++;
          updateTasks();
          return response;
        });
      }
    }

    return originalFetch(url, opts);
  };

  // Scratch uses XMLHttpRequest to upload the project JSON.
  const originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, url) {
    if (
      (method.toLowerCase() === "put" && PROJECT_REGEX.test(url)) ||
      (method.toLowerCase() === "post" && COPY_REGEX.test(url)) ||
      (method.toLowerCase() === "post" && REMIX_REGEX.test(url))
    ) {
      // This is a request made for saving, remixing, or copying a project.
      if (REMIX_REGEX.test(url)) {
        setProgressState("remix");
        injectRemixingProgressBar();
      } else {
        setProgressState("save-json");
        injectSavingProgressBar();
      }
      this.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          setProgress(e.loaded / e.total);
        }
      });
    }

    originalOpen.call(this, method, url);
  };

  // Scratch uses a Worker to fetch project assets.
  // As the worker may be constructed before we run, we have to patch postMessage to monitor message passing.
  let foundWorker = false;
  const originalPostMessage = Worker.prototype.postMessage;
  Worker.prototype.postMessage = function (message, options) {
    if (typeof message.id === "string" && typeof message.url === "string") {
      setProgressState("load-assets");
      totalTasks++;
      updateTasks();

      // Add our own message handler once for this worker to monitor when assets have finished loading.
      if (!foundWorker) {
        foundWorker = true;
        this.addEventListener("message", (e) => {
          const data = e.data;
          finishedTasks += data.length;
          updateTasks();
        });
      }
    }

    originalPostMessage.call(this, message, options);
  };

  async function injectLoadingProgressBar() {
    await addon.tab.waitForElement("[class^=loader_message-container-outer]");
    const loaderMessageContainerOuter = document.querySelector("[class^=loader_message-container-outer]");
    loaderMessageContainerOuter.hidden = true;
    loaderMessageContainerOuter.parentElement.appendChild(loadingCaption);
    loaderMessageContainerOuter.parentElement.appendChild(barOuter);
  }

  async function injectSavingProgressBar() {
    await addon.tab.waitForElement("[class^=inline-message_spinner]");
    const spinner = document.querySelector("[class^=inline-message_spinner]");
    const container = spinner.parentElement.querySelector("span");
    container.appendChild(barOuter);
  }

  async function injectRemixingProgressBar() {
    const remixButton = document.querySelector(".remix-button");
    if (remixButton) {
      remixButton.appendChild(barOuter);
    } else {
      await addon.tab.waitForElement("[class^=alert_alert-message] span");
      const alertMessage = document.querySelector("[class^=alert_alert-message] span");
      alertMessage.appendChild(barOuter);
    }
  }

  injectLoadingProgressBar();
}
