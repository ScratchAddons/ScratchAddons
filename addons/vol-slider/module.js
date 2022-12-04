// Volumes in this file are always in 0-1.

let vm;
/** @type {GainNode} */
let gainNode;
let unmuteVolume = 1;
const callbacks = [];

export const setVolume = (newVolume) => {
  gainNode.value = newVolume;
  callbacks.forEach(i => i());
};

export const getVolume = () => {
  return gainNode.value;
};

export const isMuted = () => {
  return getVolume() === 0;
};

export const setUnmutedVolume = (newUnmuteVolume) => {
  unmuteVolume = newUnmuteVolume;
};

export const toggleMuted = () => {
  if (isMuted()) {
    setVolume(unmuteVolume);
  } else {
    setUnmutedVolume(getVolume());
    setVolume(0);
  }
};

export const onVolumeChanged = (callback) => {
  callbacks.push(callback);
};

export const setup = (_vm) => {
  if (vm) return;
  vm = _vm;
  gainNode = vm.runtime.audioEngine.inputNode.gain;
};
