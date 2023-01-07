export default async function ({ addon, global, console }) {
    const share_function = document.createElement("a");
    share_function.classList.add("media-share");
    share_function.dataset.control = "share";
    share_function.href = "#";

    const share_button = document.createElement("a");
    share_button.href = "#";
    share_button.classList.add("__share_button__");
    share_button.innerText = "Share";
    share_button.addEventListener("click", event => {
        let confirmation = confirm("Would you like to share this project?");
        if (confirmation)
            event.target.parentElement.querySelector(".media-share").click();
    })

    while(true) {
        const project = await addon.tab.waitForElement("div.media-item-content.not-shared", {
            markAsSeen: true
        });
        project.querySelector(".media-action div").appendChild(share_function.cloneNode());
        project.querySelector(".media-action div").appendChild(share_button.cloneNode(true));
    }
}