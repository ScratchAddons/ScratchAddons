export default async function ({ addon, msg }) {
  const loggedInUser = await addon.auth.fetchUsername();
  const projectOwner = addon.tab.redux.state.preview.projectInfo.author.username;
  if (loggedInUser == null || loggedInUser != projectOwner) return;

  const matchUsername = /\@([A-Z]|[a-z]|[0-9]|\-|\_){1,20}/gm;

  const actionsContainer = document.querySelector(".action-buttons");
  const enableSwitcher = document.createElement("button");
  const enableSwitcherText = document.createElement("span");
  enableSwitcher.id = "sa-preview-notes-instructions";
  enableSwitcher.classList.add("button", "action-button", "sa-preview-desc");
  enableSwitcher.addEventListener("click", togglePreview);
  enableSwitcher.appendChild(enableSwitcherText);

  const instructionPreview = document.createElement("div");
  const instructionEditor = document.querySelector('textarea[name="description"]');
  const instructionContainer = instructionEditor.closest(".description-block");
  const instructionForm = instructionEditor.closest(".project-description-form");
  instructionPreview.classList.add("project-description");
  instructionPreview.innerText = instructionEditor.value;

  const notesCreditPreview = document.createElement("div");
  const notesCreditEditor = document.querySelector('textarea[name="instructions"]');
  const notesCreditContainer = notesCreditEditor.closest(".description-block");
  const notesCreditForm = notesCreditEditor.closest(".project-description-form");
  notesCreditPreview.classList.add("project-description");
  notesCreditPreview.innerText = notesCreditEditor.value;

  notesCreditContainer.appendChild(notesCreditPreview);
  instructionContainer.appendChild(instructionPreview);
  actionsContainer.appendChild(enableSwitcher);

  var currentlyEnabled = addon.settings.get("enable-default");
  togglePreview(null, currentlyEnabled);

  /**
   * Will attempt to toggle between the off and on states, however an override can be passed which will completely override the current value
   * @param {string} _
   * @param {boolean} override
   * @returns {void}
   */
  function togglePreview(_ = null, override = !currentlyEnabled) {
    enableSwitcherText.innerText = override ? msg("Disable") : msg("Enable");
    currentlyEnabled = override;

    if (override) {
      parseEditorInput(instructionPreview, instructionEditor);
      parseEditorInput(notesCreditPreview, notesCreditEditor);
    }

    setDisplayable(instructionForm, override);
    setDisplayable(instructionPreview, !override);

    setDisplayable(notesCreditForm, override);
    setDisplayable(notesCreditPreview, !override);
  }
  /**
   *
   * @param {HTMLDivElement} preview
   * @param {Element} editor
   */
  async function parseEditorInput(preview, editor) {
    let input = editor.value;
    preview.innerText = input;
  }
  /**
   * If false: sets the element's display style to none.
   * If true:  removes the display style altogether, making it go back to it's previous value.
   * @param {Element | Node} element
   * @param {boolean} shown
   * @returns {void}
   */
  function setDisplayable(element, show = true) {
    if (show) {
      element.classList.add("sa-preview-description-hidden");
      return;
    }
    element.classList.remove("sa-preview-description-hidden");
  }
}
