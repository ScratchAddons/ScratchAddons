export default async function ({ addon, console, msg }) {
  while (true) {
    const codeBlock = await addon.tab.waitForElement("div.code, pre.blocks", {
      markAsSeen: true,
    }); //For every code block

    const copyCode = document.createElement("div"); //Div used to store the text
    copyCode.className = "sa-copyCodeDiv"; //Class
    addon.tab.displayNoneWhileDisabled(copyCode); //Dynamic disable

    const copyCodeButton = document.createElement("span"); //The actual button
    copyCodeButton.className = "sa-copyCodeButton"; //Class
    copyCodeButton.textContent = msg("copy-code"); //The text
    copyCodeButton.onclick = function () {
      //Code to copy the code
      const block = this.parentNode.nextSibling;
      const codeBlockText = block.matches("pre.blocks")
        ? block.dataset.original //Get the code from data-original for scratchblocks
        : block.children[0].textContent; //Get the code from text content for div.code
      navigator.clipboard.writeText(codeBlockText);
    };

    copyCode.appendChild(copyCodeButton); //Add the copyCodeButton link to the copyCodeDiv
    codeBlock.parentNode.insertBefore(copyCode, codeBlock); //And finally, add the copyCodeDiv next to the code block
  }
}
