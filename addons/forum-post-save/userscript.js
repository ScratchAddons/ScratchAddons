export default async function ({ addon, console }) {
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
    localStorage.setItem("sa-forum-post-save", JSON.stringify(cache)); // don't use updateCache here since it won't remove deleted items
  }
  if (typeof cache[topicId]?.cache === "string") {
    box.value = cache[topicId].cache;
  }

  // Save the post contents after two seconds of no typing
  let timeout;
  box.addEventListener("input", () => {
    if (addon.self.disabled) return;
    clearTimeout(timeout);
    timeout = setTimeout(updateCache, 2000, topicId);
  });
  // Also save if the text field is unfocused
  box.addEventListener("blur", () => {
    updateCache(topicId);
  });
  // or if the addon is dynamically enabled
  addon.self.addEventListener("reenabled", () => {
    updateCache(topicId);
  });

  document.querySelector("[name=AddPostForm]")?.addEventListener("click", (e) => {
    if (!document.querySelector(".errorlist")) {
      // Delete cache if post was successful
      const cache = _getAllCache();
      delete cache[topicId];
      localStorage.setItem("sa-forum-post-save", JSON.stringify(cache));
    }
  });

  function updateCache(topic) {
    const update = {};
    update[topic] = {
      cache: box.value,
      stamp: Date.now(),
    };
    const stored = _getAllCache();
    const cache = Object.assign({ ...stored }, update);
    if (cache === stored) return; // if no diff, return
    if (!cache[topic].cache.trim()) delete cache[topic]; // Delete posts with only whitespace
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
}
