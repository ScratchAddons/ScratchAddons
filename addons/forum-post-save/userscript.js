export default (/** @type {import("../../addon-api/content-script/typedef").UserscriptUtilities} */ { addon }) => {
    const topicId = location.pathname.split("/")[3];
    const box = document.querySelector(".markItUpContainer .markItUpEditor");

    // Show the save
    const save = localStorage.getItem(`sa-forum-post-save-${topicId}`); // TODO: use new storage apis after mv3

    if (save !== null) {
        box.value = save;
    }

    let lastTimeoutId;
    box.addEventListener("input", (e) => {
        if (addon.self.disabled) return;
        if (typeof lastTimeoutId === "number") {
            clearTimeout(lastTimeoutId);
        }
        lastTimeoutId = setTimeout(() => {
            lastTimeoutId = undefined;
            localStorage.setItem(`sa-forum-post-save-${topicId}`, box.value);
        }, addon.settings.get("timeout") * 1000);
    });

    window.addEventListener("close", (e) => {
        if (!addon.self.disabled) {
            localStorage.setItem(`sa-forum-post-save-${topicId}`, box.value);
        }
    });

    addon.self.addEventListener("disabled", () => {
        if (typeof lastTimeoutId === "number") {
            clearTimeout(lastTimeoutId);
        }
    });
    
    addon.self.addEventListener("reenabled", () => {
        localStorage.setItem(`sa-forum-post-save-${topicId}`, box.value);
    })
}
