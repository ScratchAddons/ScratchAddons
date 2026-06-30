export default async function ({ addon, console, msg }) {
  function openProjectInNewTab(linkEnd = "projects/") {
    window.open(
      `https://scratch.mit.edu/${linkEnd}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  function replaceRemixSection() {
    const remixNotes = document.querySelectorAll('.remix-credit');
    const alreadyAddedInstance = document.querySelector('.compact-remix-wrapper');
    if (!remixNotes || remixNotes.length === 0 || alreadyAddedInstance) return;

    // wrap notes in a div element, in order to arrange them in a row
    const wrapper = document.createElement('div');
    const remixesText = document.createElement('span');

    remixesText.textContent = msg('remixes');
    remixesText.className = 'remixes-text';
    wrapper.appendChild(remixesText);
    wrapper.className = 'compact-remix-wrapper';
    remixNotes[0].parentNode.insertBefore(wrapper, remixNotes[0]);

    remixNotes.forEach(remixnote => {
      wrapper.appendChild(remixnote);
      const projectLink = remixnote.querySelector('.credit-text > span > a[href*="projects"]').getAttribute('href');
      // create a stable handler so it can be removed later
      const handler = (e) => {
        e.preventDefault();
        e.stopPropagation();
        openProjectInNewTab(projectLink);
      };
      // store handler reference on the element for later removal
      remixnote.__compactRemixHandler = handler;
      remixnote.addEventListener('click', handler);
    });
  };

  function revertRemixSection() {
    console.log("Removing compact remix credits section.")
    const remixNotes = document.querySelectorAll('.remix-credit');
    const alreadyAddedInstance = document.querySelector('.compact-remix-wrapper');
    const originalContainer = remixNotes[0].parentNode.parentNode;

    alreadyAddedInstance.querySelector('.remixes-text')?.remove();
    for (let idx = remixNotes.length - 1; idx > -1; idx--) {
      const note = remixNotes[idx];
      // insert back the note outside our added container
      originalContainer.insertBefore(note, originalContainer.firstElementChild);
      // remove clicking event
      if (note.__compactRemixHandler) {
        note.removeEventListener('click', note.__compactRemixHandler);
        delete note.__compactRemixHandler;
      }
    }
    alreadyAddedInstance.remove();
  }

  addon.self.addEventListener("disabled", () => revertRemixSection());
  addon.self.addEventListener("reenabled", () => replaceRemixSection());

  while (true) {
    await addon.tab.waitForElement('.remix-credit', {
      markAsSeen: true
    });
    setTimeout(() => {
      // wait until all the other remixnotes are loaded in
      replaceRemixSection();
    }, 20);
  }
}
