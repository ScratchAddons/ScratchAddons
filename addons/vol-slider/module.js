const muteIcon = "/static/assets/e21225ab4b675bc61eed30cfb510c288.svg";
const quietIcon = "/static/assets/3547fa1f2678a483a19f46852f36b426.svg";
const loudIcon = "/static/assets/b2c44c738c9cbc1a99cd6edfd0c2b85b.svg";

let vm;
let vmVol;
let defVol = 1;

export const setVol = (v) => {
  vmVol.value = v;
  let slider = document.getElementById("sa-vol-slider");
  let icon = document.getElementById("sa-vol-icon");
  if (!slider) return;
  slider.value = v;
  if (v == 0) {
    icon.src = muteIcon;
  } else if (v < 0.5) {
    icon.src = quietIcon;
  } else {
    icon.src = loudIcon;
  }
}

export const setDefVol = (v) => {
  defVol = v;
}

export const getDefVol = () => {
  return defVol;
}

export const isMuted = () => {
  return vmVol.value === 0;
}

export const setup = (_vm) => {
  if (vm) return;
  vm = _vm;
  vmVol = vm.runtime.audioEngine.inputNode.gain;
}
