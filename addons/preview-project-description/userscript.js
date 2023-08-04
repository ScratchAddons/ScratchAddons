export default async function ({ addon, console, msg }) {
    const loggedInUser = await addon.auth.fetchUsername();
    const projectOwner = document.querySelector(".project-header .title a")?.innerText;
    if (loggedInUser == null || loggedInUser != projectOwner)
        return;

    var currentlyEnabled = addon.settings.get("enable-default");
    
    if (currentlyEnabled)
        togglePreview(override=true);

    const actionsContainer = document.querySelector(".action-buttons");
    const enableSwitcher = document.createElement("button");
    enableSwitcher.id = "sa-preview-notes-instructions";
    enableSwitcher.classList.add("button", "action-button", "sa-preview-desc");
    enableSwitcher.addEventListener("click", togglePreview);

    const instructionPreview = document.createElement("div");
    const instructionEditor = document.querySelector("textarea[name=\"description\"]");
    const instructionContainer = instructionEditor.closest(".description-block");
    instructionPreview.classList.add("project-description");
    instructionPreview.innerText = instructionEditor?.value;

    const notesCreditPreview = document.createElement("div");
    const notesCreditEditor = document.querySelector("textarea[name=\"instructions\"]");
    const notesCreditContainer = notesCreditEditor.closest(".description-block");
    notesCreditPreview.classList.add("project-description");
    notesCreditPreview.innerText = notesCreditEditor?.value;

    notesCreditContainer?.appendChild(notesCreditPreview);
    instructionContainer?.appendChild(instructionPreview);
    actionsContainer?.appendChild(enableSwitcher);

    function togglePreview(_ = null, override = !currentlyEnabled) {
        enableSwitcher.innerHTML = `<span>${override ? "Disable" : "Enable"} Preview</span>`;
        currentlyEnabled = override;

        if (override) {
            instructionEditor?.style.display = "none";
            instructionPreview.innerText = instructionEditor?.value;
            instructionPreview.style.removeProperty("display");

            notesCreditEditor?.style.display = "none";
            notesCreditPreview.innerText = notesCreditEditor?.value;
            notesCreditPreview.style.removeProperty("display");
            return;
        }

        instructionEditor?.style.removeProperty("display");
        instructionPreview.style.display = "none";

        notesCreditEditor?.style.removeProperty("display");
        notesCreditPreview.style.display = "none";
    }
}