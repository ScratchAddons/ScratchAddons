import { disableTabs } from "../project-notes-tabs/disable-self.js";

export default async function ({ addon, console, msg }) {
  const divElement = Object.assign(document.createElement("div"), {
    className: "sa-toggle-project-preview",
  });
  const span = Object.assign(document.createElement("span"), {
    textContent: msg("preview"),
  });
  const label = Object.assign(document.createElement("label"), {
    className: "toggle-switch",
  });
  const checkboxInput = Object.assign(document.createElement("input"), {
    type: "checkbox",
  });
  const sliderSpan = Object.assign(document.createElement("span"), {
    className: "slider",
  });
  label.append(checkboxInput, sliderSpan);
  divElement.append(span, label);

  addon.tab.displayNoneWhileDisabled(divElement, { display: "flex" });
  addon.self.addEventListener("disabled", () => {
    togglePreview(false);
    checkboxInput.checked = false;
  });

  checkboxInput.addEventListener("change", () => {
    togglePreview(checkboxInput.checked);
  });

  const REACT_CONTAINER_PREFIX = "__reactContainere$";

  let currentlyEnabled = false;
  let wasEverEnabled = false;

  async function injectToggle() {
    // Remove our element if it's already on the page
    // This is to ensure the toggle is always next to "instructions" when editing.
    divElement.remove();

    if (!wasEverEnabled) {
      // TODO: also change animated-thumb/userscript.js (or create new utility)
      const loggedInUser = await addon.auth.fetchUsername();
      const projectOwner = addon.tab.redux.state?.preview?.projectInfo?.author?.username;
      if (!projectOwner || !loggedInUser || loggedInUser !== projectOwner) {
        return;
      }
    }

    if (document.querySelector(".sa-project-tabs-wrapper")) {
      // Since project-notes-tabs runs on runAtComplete:false, and doesn't support
      // dynamicEnable, it's very unlikely that it hasn't executed yet.
      // Worst that can happen is that the "preview" toggle isn't accessible until a reload.
      document.querySelector(".sa-project-tabs-wrapper").appendChild(divElement);
    } else {
      document.querySelector(".project-notes > .description-block > .project-textlabel").append(divElement);
    }
  }

  while (true) {
    await addon.tab.waitForElement(".project-notes, .project-description", {
      markAsSeen: true,
      reduxCondition: (state) => state.scratchGui.mode.isPlayerOnly,
    });

    injectToggle();
  }

  /**
   * Will attempt to toggle between the off and on states, however an override can be passed
   * which will completely override the current value
   * @param {boolean} override Force to a specific value.
   * @returns {void}
   */
  function togglePreview(override = !currentlyEnabled) {
    const oldCurentlyEnabled = currentlyEnabled;
    currentlyEnabled = override;

    if (currentlyEnabled === true && !wasEverEnabled) {
      wasEverEnabled = true;
      addTraps();
    }

    if (oldCurentlyEnabled === false && currentlyEnabled === true) {
      enablePreview();
    }

    if (oldCurentlyEnabled === true && currentlyEnabled === false) {
      // Disabling the preview is as simple as forcing a React
      // rerender.
      forceReactRerender();
      // This case will not cause waitForElement to fire.
      // Manually run the injectToggle() function:
      queueMicrotask(injectToggle);
    }
  }

  async function enablePreview() {
    if (document.body.classList.contains("sa-project-tabs-on")) {
      // Disable the project-notes-tabs addon if it's enabled.
      disableTabs();

      injectToggle();

      // Just in case, wait 1 event loop cycle
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    forceReactRerender();

    if (!document.querySelector(".project-description")) {
      // Something went wrong for some reason...
      console.log("Failed to show preview of project notes.");
      checkboxInput.checked = false;
      currentlyEnabled = false;
    }
  }

  function forceReactRerender() {
    // We dispatch some Redux update to force React to rerender.
    addon.tab.redux.dispatch({
      type: "SET_FETCH_STATUS",
      infoType: "parent",
      status: addon.tab.redux.state.preview.status.parent, // We do not actually change anything here.
    });
  }

  function addTraps() {
    // Override the render function of the Preview component
    // https://github.com/scratchfoundation/scratch-www/blob/fdcb700/src/views/preview/project-view.jsx
    const reactRootElement = document.querySelector("#app");
    const reactContainerKey = Object.keys(reactRootElement).find((key) => key.startsWith(REACT_CONTAINER_PREFIX));
    let instance = reactRootElement[reactContainerKey];
    while (!instance.stateNode || typeof instance.stateNode.handleUpdateProjectId !== "function") {
      instance = instance.child;
    }
    const PreviewComponent = instance.stateNode.constructor;
    const oldRender = PreviewComponent.prototype.render;
    PreviewComponent.prototype.render = function () {
      const oldProps = this.props;
      this.props = { ...this.props, isEditable: !currentlyEnabled };
      const result = oldRender.call(this);
      this.props = oldProps;
      return result;
    };
  }
}
