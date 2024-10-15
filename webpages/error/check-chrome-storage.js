const testStorage = () => {
  return new Promise((resolve, reject) => {
    setTimeout(() => reject("Reached setTimeout while testing storage"), 8000);

    chrome.storage.sync.get("addonsEnabled", (c) => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError); // Will be lost if console clears logs after navigation
        if (typeof chrome.runtime.lastError.toString === "function") reject(chrome.runtime.lastError.toString());
        else reject("Unknown lastError");
      } else if (c === null) reject("c is null");
      else if (typeof c !== "object") reject("c is not of type object");
      else if (c.addonsEnabled === null) reject("c.addonsEnabled is null");
      else if (typeof c.addonsEnabled !== "object") reject("c.addonsEnabled is not of type object");
      else if (Object.keys(c.addonsEnabled).length === 0) reject("c.addonsEnabled is an empty object");
      else {
        // Storage looks OK
        resolve();
      }
    });
  });
};

const redirectToErrorPage = (errorInfo) => {
  const url = new URL(chrome.runtime.getURL("/webpages/error/index.html"));
  url.searchParams.set("problem", "storage");
  url.searchParams.set("info", errorInfo);
  location.href = url.href;
};

// Wait a few seconds and check storage
setTimeout(() => {
  testStorage()
    .then(() => console.log("Storage test succeeded"))
    .catch((error) => {
      redirectToErrorPage(error);
    });
}, 1500);
