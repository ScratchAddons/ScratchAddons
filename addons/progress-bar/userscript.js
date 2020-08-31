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

  const HIDE_AFTER = 5000;
  let hideTimeout;

  const hideProgress = () => {
    progressBar.style.opacity = '0';
  };

  const showProgress = () => {
    progressBar.style.opacity = '1';
  };

  const setProgress = progress => {
    progressBar.style.width = `${10 + (progress * 90)}%`;
    if (progress >= 1) {
      hideProgress();
    } else {
      showProgress();
    }
    clearTimeout(hideTimeout);
    hideTimeout = setTimeout(hideProgress, HIDE_AFTER);
  };

  // Scratch uses fetch() to download the project JSON, so override the global fetch() method to monitor when the project is being downloaded.
  const originalFetch = window.fetch;
  window.fetch = (url, opts) => {
    if (typeof url === 'string' && /^https:\/\/projects\.scratch\.mit\.edu\/\d+$/.test(url) && opts.method === 'GET') {
      // This is a request for the project JSON.
      // Fetch does not support progress monitoring, so we use XMLHttpRequest instead.
      setProgress(0);
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.responseType = 'blob';
        xhr.onload = () => {
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
    return originalFetch(url, opts);
  };
}