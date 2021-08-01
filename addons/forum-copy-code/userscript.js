export default async function ({ addon, global, console, msg }) {
  var style = document.createElement("style"); //Doing this in a userscript because we have dynamic enable-disable and you can see unstyled elements for a split second
  style.textContent =
    ".sa-copyCodeDiv{text-align:right;height:0}.sa-copyCodeButton{opacity:.75;cursor:pointer;font-size:80%;position:relative;bottom:3px;user-select:none}.sa-copyCodeButton:active{text-decoration:underline}"; //The styling
  document.head.appendChild(style); //Append it

  while (true) {
    const codeBlock = await addon.tab.waitForElement("div.code", {
      markAsSeen: true,
    }); //For every code block

    const copyCode = document.createElement("div"); //Div used to store the text
    copyCode.className = "sa-copyCodeDiv"; //Class
    addon.tab.displayNoneWhileDisabled(copyCode, { display: "block" }); //Dynamic disable

    const copyCodeButton = document.createElement("span"); //The actual button
    copyCodeButton.className = "sa-copyCodeButton"; //Class
    copyCodeButton.textContent = msg("copy-code"); //The text
    copyCodeButton.onclick = function () {
      //Code to copy the code
      const codeBlockText = this.parentNode.nextSibling.children[0].textContent; //Get the code
      let textArea = document.createElement("textarea"); //Create a textarea for the copying to work
      document.body.appendChild(textArea); //Append it to the pageX
      textArea.textContent = codeBlockText; //Copy the code into the textarea
      textArea.select(); //Select
      document.execCommand("copy"); //Copy
      textArea.remove(); //It is longer needed
    };

    copyCode.appendChild(copyCodeButton); //Add the copyCodeButton link to the copyCodeDiv
    codeBlock.parentNode.insertBefore(copyCode, codeBlock); //And finally, add the copyCodeDiv next to the code block
  }
}
