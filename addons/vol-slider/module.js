// Volumes in this file are always in 0-1.

let hasSetup = false;
/** @type {AudioParam|null} */
let gainNode = null;
let unmuteVolume = 1;
let volumeBeforeFinishSetup = 1;
const callbacks = [];

export const setVolume = (newVolume) => {
  if (gainNode) {
    gainNode.value = newVolume;
  } else {
    volumeBeforeFinishSetup = newVolume;
  }
  callbacks.forEach((i) => i());
};

export const getVolume = () => {
  if (gainNode) {
    return gainNode.value;
  }
  return volumeBeforeFinishSetup;
};

export const isMuted = () => {
  return getVolume() === 0;
};

export const setUnmutedVolume = (newUnmuteVolume) => {
  unmuteVolume = newUnmuteVolume;
};

export const setMuted = (newMuted) => {
  if (newMuted) {
    setUnmutedVolume(getVolume());
    setVolume(0);
  } else {
    setVolume(unmuteVolume);
  }
};

export const onVolumeChanged = (callback) => {
  callbacks.push(callback);
};

const gotAudioEngine = (audioEngine) => {
  gainNode = audioEngine.inputNode.gain;
  gainNode.value = volumeBeforeFinishSetup;
};

export const setup = (vm) => {
  if (hasSetup) {
    return;
  }
  hasSetup = true;

  const audioEngine = vm.runtime.audioEngine;
  if (audioEngine) {
    gotAudioEngine(audioEngine);
  } else {
    vm.runtime.once("PROJECT_LOADED", () => {
      gotAudioEngine(vm.runtime.audioEngine);
    });
  }
};
