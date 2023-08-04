export default async function ({ addon, console, msg }) {
    const loggedInUser = await addon.auth.fetchUsername();
    const projectOwner = document.querySelector(".project-header a img").alt;
    if (loggedInUser == null || loggedInUser != projectOwner)
        return;

    const actionsContainer = document.querySelector(".action-buttons");
    const enableSwitcher = document.createElement("button");
    enableSwitcher.id = "sa-preview-notes-instructions";
    enableSwitcher.classList.add("button", "action-button", "sa-preview-desc");
    enableSwitcher.addEventListener("click", togglePreview);

    const instructionPreview = document.createElement("div");
    const instructionEditor = document.querySelector("textarea[name=\"description\"]");
    const instructionContainer = instructionEditor.closest(".description-block");
    const instructionForm = instructionEditor.closest(".project-description-form");
    instructionPreview.classList.add("project-description");
    instructionPreview.innerText = instructionEditor.value;

    const notesCreditPreview = document.createElement("div");
    const notesCreditEditor = document.querySelector("textarea[name=\"instructions\"]");
    const notesCreditContainer = notesCreditEditor.closest(".description-block");
    const notesCreditForm = notesCreditEditor.closest(".project-description-form");
    notesCreditPreview.classList.add("project-description");
    notesCreditPreview.innerText = notesCreditEditor.value;

    notesCreditContainer.appendChild(notesCreditPreview);
    instructionContainer.appendChild(instructionPreview);
    actionsContainer.appendChild(enableSwitcher);

    var currentlyEnabled = addon.settings.get("enable-default");
    togglePreview(null, currentlyEnabled)

    function togglePreview(_ = null, override = !currentlyEnabled) {
        enableSwitcher.innerHTML = `<span>${override ? "Disable" : "Enable"} Preview</span>`;
        currentlyEnabled = override;

        if (override) {
            instructionForm.style.display = "none";
            instructionPreview.innerText = instructionEditor.value;
            instructionPreview.style.removeProperty("display");

            notesCreditForm.style.display = "none";
            notesCreditPreview.innerText = notesCreditEditor.value;
            notesCreditPreview.style.removeProperty("display");
            return;
        }

        instructionForm.style.removeProperty("display");
        instructionPreview.style.display = "none";

        notesCreditForm.style.removeProperty("display");
        notesCreditPreview.style.display = "none";
    }
}