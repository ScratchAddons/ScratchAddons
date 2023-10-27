let injected = false;

export function applyStyles() {
  if (injected) return;
  injected = true;

  const css = `
/* appendToSharedSpace CSS for stageHeader space - see SA/SA#3030 */
[class*="stage-header_stage-header-wrapper_"] {
    height: 2.75rem;
}
  
[class*="stage-header_stage-menu-wrapper_"] {
    position: absolute;
    right: 0;
    min-width: 100%;
}
`.trim();
  document.head.appendChild(Object.assign(document.createElement("style"), { textContent: css }));
}
