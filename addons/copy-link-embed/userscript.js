export default async function ({ addon, msg }) {
  const main = () => {
    if (addon.tab.editorMode !== "projectpage") {
      return;
    }
    if (!document.querySelector(".sa-copy-link-embed")) {
      const vanillaCopyLinkButton = document.querySelector(".copy-link-button");
      const copyLinkButton = vanillaCopyLinkButton.cloneNode(true);
      copyLinkButton.classList.add("sa-copy-link-embed");
      copyLinkButton.id = "sa-copy-link";
      copyLinkButton.addEventListener("click", () => {
        navigator.clipboard.writeText(`https://scratch.mit.edu/${location.pathname}`);
      });
      const copyEmbedButton = copyLinkButton.cloneNode(true);
      copyEmbedButton.id = "sa-copy-embed";
      copyEmbedButton.firstChild.textContent = msg("copy-embed");
      copyEmbedButton.addEventListener("click", () => {
        navigator.clipboard.writeText(
          `<iframe src="https://scratch.mit.edu/${location.pathname}embed" allowtransparency="true" width="485" height="402" frameborder="0" scrolling="no" allowfullscreen></iframe>`
        );
      });
      vanillaCopyLinkButton.parentElement.appendChild(copyLinkButton);
      vanillaCopyLinkButton.parentElement.appendChild(copyEmbedButton);
    }
    document.querySelector("#sa-copy-link").style.display = addon.settings.get("copy-link") ? "" : "none";
    document.querySelector("#sa-copy-embed").style.display = addon.settings.get("copy-embed") ? "" : "none";
  };

  main();
  addon.tab.addEventListener("urlChange", main);
  addon.settings.addEventListener("change", main);
  addon.self.addEventListener("disabled", () => {
    [...document.querySelectorAll(".sa-copy-link-embed")].forEach((elt) => (elt.style.display = "none"));
  });
  addon.self.addEventListener("reenabled", () => {
    [...document.querySelectorAll(".sa-copy-link-embed")].forEach((elt) => (elt.style.display = ""));
  });
}
