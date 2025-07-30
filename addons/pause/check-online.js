let hasOnlineFeatures;

/** Guesses whether the project has cloud variable features */
const scanForOnlineFeatures = (vm, console, msg) => {
  // Well, only if it actually has cloud variables :P
  if (!vm.runtime.hasCloudData()) {
    hasOnlineFeatures = false;
    return;
  }

  const allBlocks = vm.runtime.targets.flatMap((target) => Object.values(target.blocks._blocks));
  // Map the names and values of cloud variables to an object
  const cloudVariables = {};
  const globalVariables = vm.runtime.getTargetForStage().variables;
  for (let id of Object.keys(globalVariables)) {
    if (globalVariables[id].isCloud) {
      cloudVariables[globalVariables[id].name] = globalVariables[id].value;
    }
  }

  const names = Object.keys(cloudVariables);
  const values = Object.values(cloudVariables);

  const varsHaveInvalidNumbers = values.some((i) => String(Number(i)) !== i);
  const areVarNamesSequential = names.some((i) => i.endsWith("2")) && names.some((i) => i.endsWith("3"));
  const usesUsernameBlock = allBlocks.some((block) => block.opcode === "sensing_username");

  if (varsHaveInvalidNumbers && areVarNamesSequential && usesUsernameBlock) {
    // It's definitely online
    onlineFeaturesDetected();
    document.querySelector(".pause-btn").title = msg("cannot-pause");
    console.log("Online features detected - pause disabled.");
  } else if (varsHaveInvalidNumbers || areVarNamesSequential || usesUsernameBlock) {
    // It might be online, we'll analyze during runtime
    threshold = 5;
    console.log("This Cloud project has the following characteristics:", {
      varsHaveInvalidNumbers,
      areVarNamesSequential,
      usesUsernameBlock,
    });
  }
};

let interactions = 0;
let threshold = 10;
let timeout;
/** Tracks incoming and outgoing data for cloud variables */
const onDataTransferred = (value) => {
  const hasInvalidNumbers = String(Number(value)) !== value;
  if (hasInvalidNumbers) interactions++;
  clearTimeout(timeout);
  if (interactions < threshold) {
    // Reset counter after 1.2s
    timeout = setTimeout(() => interactions = 0, 1200);
  } else {
    onlineFeaturesDetected();
  }
};

function onlineFeaturesDetected() {
  hasOnlineFeatures = true;
  document.querySelector(".pause-btn").classList.add("disabled");
}

export const getHasOnlineFeatures = () => hasOnlineFeatures;
export const checkForOnlineFeatures = async (addon, console, msg) => {
  await addon.tab.redux.waitForState((state) => state.scratchGui.projectState.loadingState.startsWith("SHOWING"));
  scanForOnlineFeatures(addon.tab.traps.vm, console, msg);
  if (hasOnlineFeatures === undefined) {
    // Watch for cloud variable updates
    const originalSend = addon.tab.traps.vm.runtime.ioDevices.cloud.provider.connection.send;
    addon.tab.traps.vm.runtime.ioDevices.cloud.provider.connection.send = function (data) {
      originalSend.call(this, data);
      const json = JSON.parse(data);
      if (!hasOnlineFeatures && json.name) {
        onDataTransferred(json.value);
        if (hasOnlineFeatures) {
          document.querySelector(".pause-btn").title = msg("cannot-pause");
          console.log("Online features detected - pause disabled.");
        }
      }
    };
    const originalOnMessage = addon.tab.traps.vm.runtime.ioDevices.cloud.provider.connection.onmessage;
    addon.tab.traps.vm.runtime.ioDevices.cloud.provider.connection.onmessage = function (message) {
      originalOnMessage.call(this, message);
      const json = JSON.parse(message.data);
      if (!hasOnlineFeatures && json.name) {
        onDataTransferred(json.value);
        if (hasOnlineFeatures) {
          document.querySelector(".pause-btn").title = msg("cannot-pause");
          console.log("Online features detected - pause disabled.");
        }
      }
    };
  }
};
