// Moved extensions: key is scratch3, value is scratch2
export const movedExtensions = {
  pen: "pen",
  video: "sensing",
  music: "sound",
}

export const extensions = {
  ...movedExtensions,
  faceSensing: "faceSensing",
  tts: "tts",
  translate: "translate",
  microbit: "microbit",
  gdxfor: "gdxfor",
  wedo: "wedo",
  makeymakey: "makeymakey",
  ev3: "ev3",
  boost: "boost",
}

// Alias extensions: unlike movedExtensions, this is handled for both scratch2 and scratch3.
// Key is alias, value is real extension name
export const aliasExtensions = {
  wedo2: "wedo",
  text2speech: "tts",
}

export const extensionList = Object.keys(extensions);
