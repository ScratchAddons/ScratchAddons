export default async function ({ addon, console, msg }) {
  const cloud = addon.tab.traps.vm.runtime.ioDevices.cloud;
  /** Disconnects the Cloud variables, in response to the user turning off the switch. */
  function disableCloud() {
    if (cloud.provider.connection.readyState === WebSocket.OPEN) {
      // First override the events that trigger a connection retry, then close the connection
      cloud.provider.connection.onclose = () => {};
      cloud.provider.connection.onerror = () => {};
      cloud.provider.connection.close();
      connected = false;
    } else {
      // WebSocket isn't open, we're not going to try to stop it now
      console.warn("Not disconnecting because WebSocket is closed");
      setCheckbox(true);
    }
  }
  /** Opens a confirmation dialog to reload the page and reconnect, in response to the user turning on the switch. */
  function reloadPrompt() {
    setCheckbox(false);
    addon.tab.scratchClassReady().then(() => {
      addon.tab
        .confirm(msg("reenable"), msg("reloadRequired"), {
          okButtonLabel: msg("confirm"),
          cancelButtonLabel: msg("cancel"),
          useEditorClasses: false, // The toggle switch that opens this dialog is outside the editor
        })
        .then((confirmed) => {
          if (confirmed) {
            location.reload();
          }
        });
    });
  }

  function addToggleSwitch() {
    const sliderContainer = Object.assign(document.createElement("div"), {
      className: "sa-toggle-cloud-off",
    });
    const label = Object.assign(document.createElement("label"), {
      className: "toggle-switch",
    });
    const checkbox = Object.assign(document.createElement("input"), {
      type: "checkbox",
      checked: connected && !addon.tab.redux.state.scratchGui.mode.hasEverEnteredEditor,
    });
    const sliderSpan = Object.assign(document.createElement("span"), {
      className: "slider",
    });
    label.append(checkbox, sliderSpan);
    sliderContainer.append(label);
    addon.tab.displayNoneWhileDisabled(sliderContainer);
    const extChip = document.querySelector(".extension-content a[href^='/cloudmonitor']").parentElement.parentElement;
    extChip.appendChild(sliderContainer);

    checkbox.addEventListener("change", () => {
      checkbox.checked ? reloadPrompt() : disableCloud();
    });
  }
  /** Sets the state of the toggle switch. */
  function setCheckbox(checked) {
    document.querySelector(".sa-toggle-cloud-off input").checked = checked;
  }

  let connected = true;

  await addon.tab.redux.waitForState((state) => state.scratchGui.projectState.loadingState.startsWith("SHOWING"));

  if (addon.tab.traps.vm.runtime.hasCloudData()) {
    let checkCnt = 0;
    while (cloud.provider?.connection.readyState !== WebSocket.OPEN) {
      checkCnt++;
      // Check at an interval of 200ms for 5 seconds, then 2s
      await new Promise((resolve) => setTimeout(resolve, checkCnt > 25 ? 2000 : 200));
    }

    while (true) {
      await addon.tab.waitForElement(".extension-content a[href^='/cloudmonitor']", {
        markAsSeen: true,
        reduxCondition: (state) => !state.scratchGui.mode.hasEverEnteredEditor,
      });

      addToggleSwitch();
    }
  }
}
