export default async function ({ addon, console, msg }) {
  const remixNotes = document.querySelectorAll('.remix-credit');

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
    remixnote.addEventListener('click', async () => {
      window.open(
        `https://scratch.mit.edu/${projectLink}`,
        "_blank",
        "noopener,noreferrer"
      );
    });
  });
}
