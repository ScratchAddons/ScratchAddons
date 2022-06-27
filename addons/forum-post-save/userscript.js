export default ({ addon }) => {
    const topicId = location.pathname.split("/")[3];
    const box = document.querySelector(".markItUpContainer .markItUpEditor");

    // Show the save
    const save = localStorage.getItem(`sa-forum-post-save-${topicId}`); // TODO: use new storage apis after mv3

    if (save !== null) {
        box.value = save;
    }

    let lastTimeoutId;
    box.addEventListener("input", (e) => {
        if (typeof lastTimeoutId === "number") {
            clearTimeout(lastTimeoutId);
        }
        lastTimeoutId = setTimeout(() => {
            lastTimeoutId = undefined;
            localStorage.setItem(`sa-forum-post-save-${topicId}`, box.value);
        }, addon.settings.get("timeout") * 1000);
    });

    window.addEventListener("close", (e) => {
        localStorage.setItem(`sa-forum-post-save-${topicId}`, box.value);
    });
}
