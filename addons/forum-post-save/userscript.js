export default ({ addon }) => {
  const topicId = location.pathname.split("/")[3];
  const box = document.querySelector(".markItUpContainer .markItUpEditor");

  // Purge cache which is over two weeks old
  const cache = _getAllCache();
  const now = Date.now();

  let madeAnyChanges = false;
  for (const topicId of Object.keys(cache)) {
    if (now - cache[topicId].stamp > 1209600000) {
      // two weeks (1000 * 60 * 60 * 24 * 14): (ms/s) * (s/m) * (m/h) * (h/d) * (d/w)
      delete cache[topicId];
      madeAnyChanges = true;
    }
  }
  if (madeAnyChanges) {
    localStorage.setItem("sa-forum-post-save", JSON.stringify(cache)); // dont use updateCache here since it won't remove deleted items
  }
  if (typeof cache[topicId]?.cache === "string") {
    box.value = cache[topicId].cache;
  }

  let lastSaved = 0;
  box.addEventListener("input", (e) => {
    if (!addon.self.disabled && Date.now() - lastSaved >= 250) {
      const update = {};
      update[topicId] = {
        cache: box.value,
        stamp: Date.now(),
      };
      updateCache(update);
    }
  });

  addon.self.addEventListener("reenabled", () => {
    const update = {};
    update[topicId] = {
      cache: box.value,
      stamp: Date.now(),
    };
    updateCache(update);
  });
};
function updateCache(assign) {
  const stored = _getAllCache();
  const cache = Object.assign({ ...stored }, assign);
  if (cache === stored) return; // if no diff, return
  localStorage.setItem("sa-forum-post-save", JSON.stringify(cache));
}
function _getAllCache() {
  let data;
  try {
    data = JSON.parse(localStorage.getItem(`sa-forum-post-save`));
  } catch {
    localStorage.setItem("sa-forum-post-save", "{}");
  }
  return data || {};
}
