export default async function ({ addon, global, console }) {
  const progressBar = document.createElement("div");
  progressBar.style.position = "fixed";
  progressBar.style.top = "0";
  progressBar.style.left = "0";
  progressBar.style.height = "5px";
  progressBar.style.backgroundColor = "white";
  progressBar.style.zIndex = "99999999";
  progressBar.style.width = "0";
  progressBar.style.opacity = "0";
  progressBar.style.transition = "all .2s";
  progressBar.style.pointerEvents = "none";
  document.body.appendChild(progressBar);

  // The progress bar will hide itself automatically after this many milliseconds without any progress update.
  // The intention here is to make it so that if the progress bar were to break, it will hide itself automatically.
  const HIDE_AFTER = 30000;
  let hideTimeout;

  // The progress bar will fully reset this many milliseconds after reaching 100% progress.
  const RESET_AFTER = 500;

  // The progress bar will always be this % filled, even at 0% progress.
  const BASE_PROGRESS = 10;

  const PROJECT_REGEX = /^https:\/\/projects\.scratch\.mit\.edu\/\d+$/;
  const REMIX_COPY_REGEX = /^https:\/\/projects\.scratch\.mit\.edu\/\?is_(?:remix|copy)=1&original_id=\d+.*$/;
  const ASSET_REGEX = /^https:\/\/assets\.scratch\.mit\.edu\/.*$/;

  let loadedAssets = 0;
  let totalAssets = 0;
  let foundWorker = false;

  const resetProgress = () => {
    progressBar.style.width = "0";
  };

  const hideProgress = () => {
    progressBar.style.opacity = "0";
  };

  const showProgress = () => {
    progressBar.style.opacity = "1";
  };

  const setProgress = (progress) => {
    progressBar.style.width = `${BASE_PROGRESS + progress * (100 - BASE_PROGRESS)}%`;
    clearTimeout(hideTimeout);
    if (progress >= 1) {
      hideProgress();
      loadedAssets = 0;
      totalAssets = 0;
      // After a little bit for the animation to complete, we'll reset the progress bar width to avoid an animation of it going from 1 to 0 the next time it's used.
      hideTimeout = setTimeout(resetProgress, RESET_AFTER);
    } else {
      showProgress();
      hideTimeout = setTimeout(hideProgress, HIDE_AFTER);
    }
  };

  // Scratch uses fetch() to download the project JSON and upload project assets.
  const originalFetch = window.fetch;
  window.fetch = (url, opts) => {
    if (typeof url === "string" && opts && typeof opts.method === "string") {
      if (opts.method.toLowerCase() === "get" && PROJECT_REGEX.test(url)) {
        // This is a request to get the project JSON.
        // Fetch does not support progress monitoring, so we use XMLHttpRequest instead.
        setProgress(0);
        return new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.responseType = "blob";
          xhr.onload = () => {
            setProgress(1);
            // As we are emulating fetch(), we need to resolve with a response object.
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
        totalAssets++;
        setProgress(loadedAssets / totalAssets);
        return originalFetch(url, opts).then((response) => {
          loadedAssets++;
          setProgress(loadedAssets / totalAssets);
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
      (method.toLowerCase() === "post" && REMIX_COPY_REGEX.test(url))
    ) {
      // This is a request made for saving, copying, or remixing a project.
      setProgress(0);
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
  const originalPostMessage = Worker.prototype.postMessage;
  Worker.prototype.postMessage = function (message, options) {
    if (typeof message.id === "string" && typeof message.url === "string") {
      // This is a message passed from the main thread to the worker thread responsible for downloading.
      totalAssets++;
      setProgress(loadedAssets / totalAssets);

      // Add our own message handler once for this worker to monitor when assets have finished loading.
      if (!foundWorker) {
        foundWorker = true;
        this.addEventListener("message", (e) => {
          const data = e.data;
          // Scratch will send multiple assets in a single message with an array.
          loadedAssets += data.length;
          setProgress(loadedAssets / totalAssets);
        });
      }
    }

    originalPostMessage.call(this, message, options);
  };
}
