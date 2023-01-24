export const stageEventTarget = new EventTarget();

let reduxHandler;

const listener = ({ detail }) => {
  if (detail.action.type !== "scratch-gui/StageSize/SET_STAGE_SIZE") return;
  stageEventTarget.dispatchEvent(
    new CustomEvent("sizechanged", {
      detail: {
        newSize: detail.next.scratchGui.stageSize.stageSize,
        oldSize: detail.prev.scratchGui.stageSize.stageSize,
      },
    })
  );
};

let queue = [];

function dispatch(action) {
  if (!reduxHandler) queue.push(action);
  else {
    reduxHandler.dispatch(action);
  }
}

export function setup(redux) {
  reduxHandler?.removeEventListener("statechanged", listener);

  reduxHandler = redux;

  redux.addEventListener("statechanged", listener);

  listener({
    detail: {
      action: {
        type: "scratch-gui/StageSize/SET_STAGE_SIZE",
      },
      next: {
        scratchGui: {
          stageSize: {
            stageSize: redux.state.scratchGui.stageSize.stageSize,
          },
        },
      },
      prev: {
        scratchGui: {
          stageSize: {
            stageSize: redux.state.scratchGui.stageSize.stageSize,
          },
        },
      },
    },
  }); // initial set

  for (const queuedAction of queue) {
    redux.dispatch(queuedAction);
  }
}

export function setStageSize(size) {
  dispatch({
    type: "scratch-gui/StageSize/SET_STAGE_SIZE",
    stageSize: size,
  });
}

export function getStageSize() {
  return reduxHandler?.state.scratchGui.stageSize.stageSize;
}
