export default async function ({ addon }) {
  const preview = await addon.tab.waitForElement(".markItUpPreviewFrame"); // when preview first clicked
  const observer = new MutationObserver((records) => { // when preview updated
    for (let record of records) {
      if (record.type === "childList") {
        for (let node of record.addedNodes) {
          if (
            node.tagName === "script" &&
            node.href ==
              "//cdn.scratch.mit.edu/scratchr2/static/__0013507cb4feac8f99604c00dcc247bb__//djangobb_forum/scratchblocks/scratchblocks.js"
          ) { // if scratchblocks loaded
            const style = document.createElement("link");
            style.rel = "stylesheet";
            style.href = addon.self.dir + "/userstyle.css";
            preview.contentDocument.head.appendChild(createStyle(style)); // add styles
            const script = document.createElement("script");
            script.href = addon.self.dir + "/userscript.js";
            preview.contentDocument.head.appendChild(createStyle(script)); // add scripts
          }
        }
      }
    }
  });
  observer.observe(preview.contentDocument, { subtree: true, childList: true });
}
