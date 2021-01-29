export default async function ({ addon, global, console }) {
  while (true) {
    let comment = await addon.tab.waitForElement(".comment .content, .comment-content", { markAsSeen: true });
    comment.style.whiteSpace = "break-spaces";
    if (!comment.classList.contains("comment-content")) {
      let nodes = comment.childNodes;
      for (let child of nodes)
        if (child.nodeName === "#text") {
          if (child == nodes[0]) {
            child.textContent = child.textContent.trimStart();
            if (!child.nextSibling) {
              child.textContent = child.textContent.trim();
            }
          } else {
            if (child == nodes[nodes.length - 1]) {
              child.textContent = child.textContent.trimEnd();
            }
            let firstA = [...nodes].find(
              (n) => n.tagName === "A" && (!n.previousSibling || n.previousSibling.textContent == "")
            );

            if (firstA && child.previousSibling === firstA && child.previousSibling.tagName === "A") {
              if (child.textContent.startsWith(" *")) {
                console.log(child.textContent);
                child.textContent =
                  "* " +
                  child.textContent
                    .split("")
                    .splice(
                      child.textContent
                        .split("")
                        .indexOf(child.textContent.split("").find((c) => ![10, 32, 42].includes(c.charCodeAt(0)))),
                      child.textContent
                        .split("")
                        .indexOf(child.textContent.split("").find((c) => ![10, 32, 42].includes(c.charCodeAt(0))))
                    )
                    .join("");
              }
              child.textContent = " " + child.textContent.trimStart();
            }
          }
        }
    }
  }
}
