export default async function ({ addon, console, msg }) {
  const loggedInUser = await addon.auth.fetchUsername();
  const projectOwner = addon.tab.redux.state.preview.projectInfo.author.username;
  if (loggedInUser == null || loggedInUser != projectOwner) return;

  const matchUsername = /\@([A-Z]|[a-z]|[0-9]|\-|\_){1,20}/gm;
  const moreLinksEnabled = (await addon.self.getEnabledAddons()).includes("more-links");
  const matchHyperLinks = /(https?\:\/\/)?.*\.([A-Z]|[a-z]|-){2,24}((\/.*)*)?/gm;

  const actionsContainer = await addon.tab.waitForElement(".action-buttons");
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
   * @param {any} _ This exists because this is used as an event body(line 13)
   * @param {boolean} override Force to a specific value.
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
   * @param {HTMLDivElement} preview Where to place the rendered output.
   * @param {Element} editor Where to grab the input to render, should be an editable with a value attribute.
   */
  async function parseEditorInput(preview, editor) {
    let input = editor.value.replace(/\</g, "&lt;").replace(/\>/g, "&gt;").replace(/\&/g, "&amp;");
    let rendered = input.replace(matchUsername, (matched) => {
      return `<a href="/users/${matched.slice(1)}">${matched}</a>`;
    });
    if (moreLinksEnabled)
      rendered.replace(matchHyperLinks, (matched) => {
        if (matched.startsWith("https://") || matched.startsWith("http://")) matched = "//" + matched;
        return `<a href="${matched}">${matched}</a>`;
      });
    preview.innerHTML = rendered;
  }

  /**
   * Toggles visibility with the class `sa-preview-description-hidden`
   * @param {Element | Node} element Element to set visibility on.
   * @param {boolean} shown Wether to show element or not.
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
