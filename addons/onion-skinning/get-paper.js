let reactInternalKey;

const getPaper = () => {
  const REACT_INTERNAL_PREFIX = "__reactInternalInstance$";

  // We can access paper through .tool on tools, for example:
  // https://github.com/LLK/scratch-paint/blob/develop/src/containers/bit-brush-mode.jsx#L60-L62
  // It happens that paper's Tool objects contain a reference to the entirety of paper's scope.
  const modeSelector = document.querySelector("[class*='paint-editor_mode-selector']");
  if (!reactInternalKey) {
    reactInternalKey = Object.keys(modeSelector).find((i) => i.startsWith(REACT_INTERNAL_PREFIX));
  }
  const internalState = modeSelector[reactInternalKey].child;

  // .tool or .blob.tool only exists on the selected tool
  let toolState = internalState;
  let tool;
  while (toolState) {
    const toolInstance = toolState.child.stateNode;
    if (toolInstance.tool) {
      tool = toolInstance.tool;
      break;
    }
    if (toolInstance.blob && toolInstance.blob.tool) {
      tool = toolInstance.blob.tool;
      break;
    }
    toolState = toolState.sibling;
  }

  if (tool) {
    const paperScope = tool._scope;
    return paperScope;
  }

  throw new Error("cannot find paper :(");
};

export default getPaper;
