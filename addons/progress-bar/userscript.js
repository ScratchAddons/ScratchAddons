export default async function ({ addon, global, console }) {
  const progressBar = document.createElement('div');
  progressBar.style.position = 'absolute';
  progressBar.style.top = '0';
  progressBar.style.left = '0';
  progressBar.style.height = '5px';
  progressBar.style.backgroundColor = 'white';
  progressBar.style.zIndex = '99999999';
  progressBar.style.width = '0';
  progressBar.style.opacity = '0';
  progressBar.style.transition = 'all .2s';
  progressBar.style.pointerEvents = 'none';
  document.body.appendChild(progressBar);

  // The progress bar will hide itself automatically after this many milliseconds without any progress update.
  // The intention here is to make it so that if the progress bar were to break, it would hide itself shortly without sticking around forever.
  const HIDE_AFTER = 5000;
  let hideTimeout;

  const PROJECT_REGEX = /^https:\/\/projects\.scratch\.mit\.edu\/\d+$/;
  const REMIX_COPY_REGEX = /^https:\/\/projects\.scratch\.mit\.edu\/\?is_(?:remix|copy)=1&original_id=\d+.*$/;
  const ASSET_REGEX = /^https:\/\/assets\.scratch\.mit\.edu\/.*$/;

  let loadedAssets = 0;
  let totalAssets = 0;
  let foundWorker = false;

  const resetProgress = () => {
    progressBar.style.width = '0';
  };

  const hideProgress = () => {
    progressBar.style.opacity = '0';
  };

  const showProgress = () => {
    progressBar.style.opacity = '1';
  };

  const setProgress = progress => {
    progressBar.style.width = `${10 + (progress * 90)}%`;
    clearTimeout(hideTimeout);
    if (progress >= 1) {
      hideProgress();
      loadedAssets = 0;
      totalAssets = 0;
      // After a little bit for the animation to complete, we'll reset the progress bar width to avoid an animation of it going from 1 to 0 the next time it's used.
      hideTimeout = setTimeout(resetProgress, 1000);
    } else {
      showProgress();
      hideTimeout = setTimeout(hideProgress, HIDE_AFTER);
    }
  };

  // Scratch uses fetch() to download the project JSON and upload project assets.
  const originalFetch = window.fetch;
  window.fetch = (url, opts) => {
    if (typeof url === 'string' && opts && typeof opts.method === 'string') {
      if (opts.method.toLowerCase() === 'get' && PROJECT_REGEX.test(url)) {
        // This is a request for the project JSON.
        // Fetch does not support progress monitoring, so we use XMLHttpRequest instead.
        setProgress(0);
        return new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.responseType = 'blob';
          xhr.onload = () => {
            setProgress(1);
            resolve(new Response(xhr.response, {
              status: xhr.status,
              statusText: xhr.statusText
            }));
          };
          xhr.onerror = () => reject(new Error('xhr failed'));
          xhr.onprogress = e => {
            if (e.lengthComputable) {
              setProgress(e.loaded / e.total);
            }
          };
          xhr.open('GET', url);
          xhr.send();
        });
      }
      if (opts.method.toLowerCase() === 'post' && ASSET_REGEX.test(url)) {
        // This is a request to upload an asset.
        // Sadly, it doesn't seem to be possible to monitor progress on these requests even with XHR, as the asset endpoint
        // returns 405s when an OPTIONS preflight request is made, which is required when we put listeners on `xhr.upload`
        totalAssets++;
        setProgress(0);
        return originalFetch(url, opts)
          .then(response => {
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
    if ((method.toLowerCase() === 'put' && PROJECT_REGEX.test(url)) || (method.toLowerCase() === 'post' && REMIX_COPY_REGEX.test(url))) {
      setProgress(0);
      this.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          setProgress(e.loaded / e.total);
        }
      });
    }
    originalOpen.call(this, method, url);
  };

  // Scratch uses a Worker to fetch project assets.
  const originalPostMessage = Worker.prototype.postMessage;
  Worker.prototype.postMessage = function (message, options) {
    if (typeof message.id === 'string' && typeof message.url === 'string') {
      totalAssets++;
      setProgress(loadedAssets / totalAssets);

      // Add our own message handler for this worker to monitor when assets have finished loading.
      if (!foundWorker) {
        foundWorker = true;
        this.addEventListener('message', e => {
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
