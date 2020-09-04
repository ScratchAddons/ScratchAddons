class ProgressBar {
  constructor() {
    this.outer = document.createElement("div");
    this.outer.className = "u-progress-bar-outer";
    this.inner = document.createElement("div");
    this.inner.className = "u-progress-bar-inner";
    this.outer.appendChild(this.inner);

    this.totalTasks = 0;
    this.finishedTasks = 0;
  }

  newTask(n = 1) {
    this.totalTasks += n;
    this.setProgress(this.finishedTasks / this.totalTasks);
  }

  finishTask(n = 1) {
    this.finishedTasks += n;
    this.setProgress(this.finishedTasks / this.totalTasks);
  }

  onchange(progress) {
    // To be overridden.
  }

  setProgress(progress) {
    this.inner.style.width = progress * 100 + "%";
    this.onchange(progress);
  }
}

export default async function ({ addon, global, console }) {
  const projectSavingProgressBar = new ProgressBar();
  projectSavingProgressBar.outer.classList.add("u-progress-bar-saving");
  projectSavingProgressBar.onchange = function (progress) {
    if (progress >= 1) {
      this.outer.style.opacity = "0";
    } else {
      this.outer.style.opacity = "1";
    }
  };
  document.body.appendChild(projectSavingProgressBar.outer);

  const loadingProgressBar = new ProgressBar();
  loadingProgressBar.outer.classList.add("u-progress-bar-loading");

  const loadingCaption = document.createElement("div");
  loadingCaption.innerText = "Loading project data …";
  loadingCaption.className = "u-progress-bar-caption";
  loadingProgressBar.onchange = function () {
    if (this.totalTasks > 0) {
      loadingCaption.innerText = `Loading assets (${this.finishedTasks}/${this.totalTasks}) …`;
    }
  };

  const PROJECT_REGEX = /^https:\/\/projects\.scratch\.mit\.edu\/\d+$/;
  const REMIX_COPY_REGEX = /^https:\/\/projects\.scratch\.mit\.edu\/\?is_(?:remix|copy)=1&original_id=\d+.*$/;
  const ASSET_REGEX = /^https:\/\/assets\.scratch\.mit\.edu\/.*$/;

  // Scratch uses fetch() to download the project JSON and upload project assets.
  const originalFetch = window.fetch;
  window.fetch = (url, opts) => {
    if (typeof url === "string" && opts && typeof opts.method === "string") {
      if (opts.method.toLowerCase() === "get" && PROJECT_REGEX.test(url)) {
        // This is a request to get the project JSON.
        // Fetch does not support progress monitoring, so we use XMLHttpRequest instead.
        loadingProgressBar.setProgress(0);
        return new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.responseType = "blob";
          xhr.onload = () => {
            loadingProgressBar.setProgress(1);
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
            const length = e.lengthComputable ? e.total : +xhr.getResponseHeader("Content-Length");
            if (length) {
              loadingProgressBar.setProgress(e.loaded / length);
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
        projectSavingProgressBar.newTask();
        return originalFetch(url, opts).then((response) => {
          projectSavingProgressBar.finishTask();
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
      projectSavingProgressBar.setProgress(0);
      this.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          projectSavingProgressBar.setProgress(e.loaded / e.total);
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
      loadingProgressBar.newTask();

      // Add our own message handler once for this worker to monitor when assets have finished loading.
      if (!foundWorker) {
        foundWorker = true;
        this.addEventListener("message", (e) => {
          const data = e.data;
          loadingProgressBar.finishTask(data.length);
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
    loaderMessageContainerOuter.parentElement.appendChild(loadingProgressBar.outer);
  }

  await injectLoadingProgressBar();
}
