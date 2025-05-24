import { isBadRequest } from "../faster-project-loading/module.js";

export default async function ({ addon, console, msg }) {
  const useTopBar = addon.settings.get("topbar");

  const barOuter = document.createElement("div");
  barOuter.className = "u-progress-bar-outer";
  const barBackground = document.createElement("div");
  barBackground.className = "u-progress-bar-background";
  barOuter.appendChild(barBackground);
  const barInner = document.createElement("div");
  barInner.className = "u-progress-bar-inner";
  barOuter.appendChild(barInner);

  if (useTopBar) {
    barOuter.classList.add("u-progress-bar-top");
    barOuter.style.opacity = "0";
    addon.tab.waitForElement("body").then(() => document.body.appendChild(barOuter));
  } else {
    barOuter.classList.add("u-progress-bar-integrated");
  }
  addon.tab.displayNoneWhileDisabled(barOuter);

  // We track the loading phase so that we can detect when the phase changed to reset and move the progress bar accordingly.
  const NONE = "none";
  const LOAD_JSON = "load-json";
  const LOAD_ASSETS = "load-assets";
  const SAVE_JSON = "save-json";
  const SAVE_ASSETS = "save-assets";
  const COPY = "copy";
  const REMIX = "remix";
  let loadingPhase = NONE;

  let totalTasks = 0;
  let finishedTasks = 0;

  let resetTimeout;

  // A boolean indicating if the bug scratch-gui#8805 has happened.
  let hasBadRequests = false;

  function setProgress(progress) {
    if (progress < 0) progress = 0;
    if (progress > 1) progress = 1;
    if (useTopBar) {
      // The bar is always at least 10% visible to give an indication of something happening, even at 0% progress.
      barInner.style.width = 10 + progress * 90 + "%";
      if (progress === 1) {
        barOuter.style.opacity = "0";
        // Reset the progress bar back to 0 width once the animation has completed.
        // This makes it so that the progress bar won't play a transition of going from 100% to 0% the next time the bar is shown.
        clearTimeout(resetTimeout);
        resetTimeout = setTimeout(resetProgressWidth, 500);
      } else {
        barOuter.style.opacity = "1";
      }
    } else {
      barInner.style.width = progress * 100 + "%";
      if (loadingPhase === LOAD_ASSETS) {
        loadingCaption.innerText = msg("loading-assets", {
          loaded: finishedTasks,
          loading: totalTasks,
        });
      }
    }
    if (progress === 1) {
      loadingPhase = NONE;
      stopObserver();
    }
  }

  function setLoadingPhase(newPhase) {
    if (loadingPhase === newPhase) {
      return;
    }
    loadingPhase = newPhase;
    setProgress(0);
    inject();
    startObserver();
    totalTasks = 0;
    finishedTasks = 0;
    hasBadRequests = false;
  }

  function updateTasks() {
    setProgress(finishedTasks / totalTasks);
  }

  function resetProgressWidth() {
    barInner.style.width = "0";
  }

  const loadingCaption = document.createElement("div");
  loadingCaption.innerText = msg("loading-project");
  loadingCaption.className = "u-progress-bar-caption";

  const PROJECT_REGEX = /^https:\/\/projects\.scratch\.mit\.edu\/\d+/;
  const ASSET_REGEX = /^https:\/\/assets\.scratch\.mit\.edu\//;

  // Scratch uses fetch() to download the project JSON and upload project assets.
  const originalFetch = window.fetch;
  window.fetch = (url, opts) => {
    if (!addon.self.disabled && typeof url === "string" && opts && typeof opts.method === "string") {
      if (opts.method.toLowerCase() === "get" && PROJECT_REGEX.test(url)) {
        // This is a request to get the project JSON.
        // Fetch does not support progress monitoring, so we use XMLHttpRequest instead.
        setLoadingPhase(LOAD_JSON);
        return new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.responseType = "blob";
          xhr.onload = () =>
            resolve(
              new Response(xhr.response, {
                status: xhr.status,
                statusText: xhr.statusText,
              })
            );
          xhr.onerror = () => reject(new Error("xhr failed"));
          xhr.onloadend = () => setProgress(1);
          xhr.onprogress = (e) => {
            if (e.lengthComputable) {
              setProgress(e.loaded / e.total);
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
        setLoadingPhase(SAVE_ASSETS);
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
  XMLHttpRequest.prototype.open = function (...args) {
    const method = args[0];
    const url = args[1];
    if (!addon.self.disabled && typeof method === "string" && typeof url === "string") {
      if ((method.toLowerCase() === "put" || method.toLowerCase() === "post") && PROJECT_REGEX.test(url)) {
        const searchParams = new URLSearchParams(url);
        // This is a request to save, remix, or copy a project.
        if (searchParams.has("is_remix")) {
          setLoadingPhase(REMIX);
        } else if (searchParams.has("is_copy")) {
          setLoadingPhase(COPY);
        } else {
          setLoadingPhase(SAVE_JSON);
        }
        this.upload.addEventListener("loadend", (e) => {
          setProgress(1);
        });
        this.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            setProgress(e.loaded / e.total);
          }
        });
      }
    }

    originalOpen.apply(this, args);
  };

  // Scratch uses a Worker to fetch project assets.
  // As the worker may be constructed before we run, we have to patch postMessage to monitor message passing.
  let foundWorker = false;

  const originalPostMessage = Worker.prototype.postMessage;
  Worker.prototype.postMessage = function (message, options) {
    if (!addon.self.disabled && message && typeof message.id === "string" && typeof message.url === "string") {
      // This is a message passed to the worker to start an asset download.
      setLoadingPhase(LOAD_ASSETS);

      function addTask() {
        ++totalTasks;
        updateTasks();
      }

      if (isBadRequest(message)) {
        addTask();
        hasBadRequests |= true;
      } else {
        // Only add the task if a bad request hasn't already added it
        if (!hasBadRequests) addTask();

        // Add our own message handler once for this worker to monitor when assets have finished loading.
        if (!foundWorker) {
          foundWorker = true;
          this.addEventListener("message", (e) => {
            const data = e.data;
            if (Array.isArray(data)) {
              finishedTasks += data.length;
              updateTasks();
            }
          });
        }
      }
    }

    originalPostMessage.call(this, message, options);
  };

  function inject() {
    // When the progress bar is already in the document, we do not need to do anything.
    if (document.querySelector(".u-progress-bar-outer")) {
      return;
    }

    const loaderMessageContainerOuter = document.querySelector('[class^="loader_message-container-outer"]');
    if (loaderMessageContainerOuter) {
      loaderMessageContainerOuter.hidden = true;
      loaderMessageContainerOuter.parentElement.appendChild(loadingCaption);
      loaderMessageContainerOuter.parentElement.appendChild(barOuter);
      return;
    }

    const spinner = document.querySelector('[class^="inline-message_spinner"]');
    if (spinner) {
      const container = spinner.parentElement.querySelector("span");
      container.appendChild(barOuter);
      return;
    }

    const remixButton = document.querySelector(".remix-button.remixing");
    if (remixButton) {
      remixButton.appendChild(barOuter);
      return;
    }

    const alertMessage = document.querySelector('[class^="alert_alert-message"] span');
    if (alertMessage) {
      alertMessage.appendChild(barOuter);
      return;
    }
  }

  const mutationObserver = new MutationObserver(inject);

  async function startObserver() {
    if (useTopBar) return;
    await addon.tab.waitForElement("body");
    inject();
    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  function stopObserver() {
    if (useTopBar) return;
    mutationObserver.disconnect();
  }
}
