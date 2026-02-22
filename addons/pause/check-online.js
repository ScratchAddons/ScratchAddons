let lastTransfer = -Infinity;

/** Returns true unless cloud data was transferred in the last 15s */
export const autoPauseAvailable = () => lastTransfer < performance.now() - 15000;

const onDataTransferred = (message) => {
  if (!message.name) return; // Ignore handshakes
  lastTransfer = performance.now();
};

export async function startCheckingCloudTraffic(api) {
  await api.redux.waitForState((state) => state.scratchGui.projectState.loadingState.startsWith("SHOWING"));
  // If the project has cloud variables, monitor traffic so that
  // we can avoid automatically pausing during communication
  if (api.traps.vm.runtime.hasCloudData()) {
    const originalSend = api.traps.vm.runtime.ioDevices.cloud.provider.connection.send;
    api.traps.vm.runtime.ioDevices.cloud.provider.connection.send = function (data) {
      originalSend.call(this, data);
      const json = JSON.parse(data);
      onDataTransferred(json);
    };
    const originalOnMessage = api.traps.vm.runtime.ioDevices.cloud.provider.connection.onmessage;
    api.traps.vm.runtime.ioDevices.cloud.provider.connection.onmessage = function (message) {
      originalOnMessage.call(this, message);
      const json = JSON.parse(message.data);
      onDataTransferred(json);
    };
  }
}
