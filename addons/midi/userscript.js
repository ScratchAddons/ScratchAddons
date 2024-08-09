const MSG_NOTE_OFF = 0x80;
const MSG_NOTE_ON = 0x90;
const MSG_PROGRAM_CHANGE = 0xC0;

const CH_PERCUSSION = 9;

// The General MIDI program number for each Scratch instrument
const MIDI_INSTRUMENTS = [
  0, // Piano
  4, // Electric Piano
  16, // Organ
  24, // Guitar
  27, // Electric Guitar
  32, // Bass
  45, // Pizzicato
  42, // Cello
  57, // Trombone
  71, // Clarinet
  65, // Saxophone
  73, // Flute
  74, // Wooden Flute
  70, // Bassoon
  52, // Choir
  11, // Vibraphone
  10, // Music Box
  114, // Steel Drum
  12, // Marimba
  80, // Synth Lead
  90, // Synth Pad
];

// The General MIDI note number for each Scratch drum
const MIDI_PERCUSSION = [
  38, // Snare Drum
  35, // Bass Drum
  37, // Side Stick
  49, // Crash Cymbal
  46, // Open Hi-Hat
  42, // Closed Hi-Hat
  54, // Tambourine
  39, // Hand Clap
  75, // Claves
  76, // Wood Block
  56, // Cowbell
  81, // Triangle
  61, // Bongo
  63, // Conga
  69, // Cabasa
  74, // Guiro
  58, // Vibraslap
  78, // Cuica
];

const SVG_NS = "http://www.w3.org/2000/svg";
const XLINK_NS = "http://www.w3.org/1999/xlink";

const DROPDOWN_ICON_URL_WHITE = "/static/blocks-media/default/dropdown-arrow.svg";
const DROPDOWN_ICON_URL_BLACK = "/static/blocks-media/default/dropdown-arrow-dark.svg";
const DROPDOWN_ICON_SIZE = 12;
const DROPDOWN_ICON_MARGIN = 8;
const DROPDOWN_ICON_Y = 16;

export default async function ({ addon, console, msg }) {
  let midi = null;
  let midiBlocked = false;
  const channelData = new Array(16).fill().map(() => ({
    instrument: -1,
    notesPlaying: new Map(),
  }));
  const targetChannels = new WeakMap();
  let output = null;

  let nextChannel = 0;
  const getNextChannel = () => {
    // Assign a MIDI channel to each target that plays music.
    let result = nextChannel;
    ++nextChannel;
    if (nextChannel === CH_PERCUSSION) ++nextChannel;
    if (nextChannel > 15) nextChannel = 0;
    return result;
  };

  let oldPlayNote;
  const playNote = function (util, note, durationSec) {
    if (!output) return oldPlayNote.call(this, util, note, durationSec);
    let channel;
    if (targetChannels.has(util.target)) {
      channel = targetChannels.get(util.target);
    } else {
      channel = getNextChannel();
      targetChannels.set(util.target, channel);
    }
    const scratchInstrument = this._getMusicState(util.target).currentInstrument;
    const midiInstrument = MIDI_INSTRUMENTS[scratchInstrument] ?? MIDI_INSTRUMENTS[0];
    if (channelData[channel].instrument !== midiInstrument) {
      output.send([MSG_PROGRAM_CHANGE + channel, midiInstrument]);
      channelData[channel].instrument = midiInstrument;
    }
    // Scratch supports notes between 0 and 130. The highest MIDI note is 127.
    const midiNote = note > 127 ? note - 12 : note;
    const velocity = Math.round(127 / 100 * util.target.volume);
    const durationMs = 1000 * durationSec;
    const notesPlaying = channelData[channel].notesPlaying;
    const key = `${midiInstrument}_${midiNote}`;
    const entry = notesPlaying.get(key);
    if (typeof entry !== "undefined") {
      // The same note is already being played
      clearTimeout(entry.timeout);
      output.send([MSG_NOTE_OFF + channel, midiNote, 64]);
    }
    output.send([MSG_NOTE_ON + channel, midiNote, velocity]);
    notesPlaying.set(key, {
      midiNote,
      timeout: setTimeout(() => {
        output.send([MSG_NOTE_OFF + channel, midiNote, 64]);
        notesPlaying.delete(key);
      }, durationMs),
    });
  };

  let oldPlayDrum;
  const playDrum = function (util, scratchDrum) {
    if (!output) return oldPlayDrum.call(this, util, scratchDrum);
    const midiNote = MIDI_PERCUSSION[scratchDrum] ?? MIDI_PERCUSSION[0];
    const velocity = Math.round(127 / 100 * util.target.volume);
    output.send([MSG_NOTE_ON + CH_PERCUSSION, midiNote, velocity]);
    output.send([MSG_NOTE_OFF + CH_PERCUSSION, midiNote, 64]);
  };

  const vm = addon.tab.traps.vm;
  const oldRegisterInternalExtension = vm.extensionManager._registerInternalExtension;
  vm.extensionManager._registerInternalExtension = function (extensionObj) {
    if (extensionObj.getInfo().id === "music") {
      oldPlayNote = extensionObj._playNote;
      extensionObj._playNote = playNote;
      oldPlayDrum = extensionObj._playDrumNum;
      extensionObj._playDrumNum = playDrum;
    }
    return oldRegisterInternalExtension.call(this, extensionObj);
  };

  // UI for selecting input device

  let midiDropdown = null;

  const closeMidiDropdown = () => {
    if (!midiDropdown) return;
    midiDropdown.remove();
    midiDropdown = null;
  };

  const createDropdownItem = (label) => {
    const item = Object.assign(document.createElement("li"), {
      innerText: label,
    });
    item.insertBefore(Object.assign(document.createElement("img"), {
      className: "sa-midi-selected-icon",
      src: addon.self.dir + "/check.svg",
    }), item.firstChild);
    return item;
  };

  const updateSelection = () => {
    if (!midiDropdown) return;
    for (const item of midiDropdown.querySelectorAll("li")) {
      if (item.dataset.id) {
        item.classList.toggle("sa-midi-selected", item.dataset.id === output?.id);
      } else {
        item.classList.toggle("sa-midi-selected", output === null);
      }
    }
  };

  const setOutput = (newOutput) => {
    if (output) {
      for (let channel = 0; channel <= 15; ++channel) {
        for (let [key, entry] of channelData[channel].notesPlaying) {
          output.send([MSG_NOTE_OFF + channel, entry.midiNote, 64]);
        }
      }
    }
    output = newOutput;
    updateSelection();
  };

  const createDropdownContent = () => {
    const noneItem = createDropdownItem(msg("none"));
    midiDropdown.appendChild(noneItem);
    noneItem.addEventListener("click", () => setOutput(null));
    for (const midiOutput of midi.outputs.values()) {
      const dropdownItem = createDropdownItem(midiOutput.name);
      midiDropdown.appendChild(dropdownItem);
      dropdownItem.dataset.id = midiOutput.id;
      dropdownItem.addEventListener("click", () => setOutput(midiOutput));
    }
    updateSelection();
  }

  const toggleMidiDropdown = async (button, inEditor) => {
    if (midiDropdown) {
      closeMidiDropdown();
      return;
    }
    if (!midi && !midiBlocked) {
      try {
        midi = await navigator.requestMIDIAccess({ software: true });
      } catch (e) {
        console.warn(e);
        midiBlocked = true;
      }
    }
    const buttonPos = button.getBoundingClientRect();
    midiDropdown = Object.assign(document.createElement("ul"), {
      className: `sa-midi-dropdown ${inEditor ? "sa-midi-dropdown-editor" : ""}`,
      style: `
        left: ${window.scrollX + buttonPos.left}px;
        top: ${window.scrollY + buttonPos.bottom}px;
      `,
    });
    document.body.appendChild(midiDropdown);
    document.addEventListener("click", () => closeMidiDropdown(), { once: true });
    midiDropdown.addEventListener("click", (e) => e.stopPropagation());
    const flyoutSvg = document.querySelector(".blocklyFlyout");
    if (flyoutSvg) flyoutSvg.addEventListener("wheel", () => closeMidiDropdown(), { once: true });
    if (midiBlocked) {
      midiDropdown.classList.add("sa-midi-error");
      midiDropdown.textContent = msg("permission-error");
    } else {
      createDropdownContent();
    }
  };

  // Editor
  addon.tab.traps.getBlockly().then((Blockly => {
    const addDropdownIcon = (button) => {
      button.width += DROPDOWN_ICON_MARGIN + DROPDOWN_ICON_SIZE;
      button.svgGroup_.querySelector(".blocklyFlyoutButtonBackground").setAttribute("width", button.width);
      button.svgGroup_.querySelector(".blocklyFlyoutButtonShadow").setAttribute("width", button.width);
      const icon = document.createElementNS(SVG_NS, "image");
      icon.setAttributeNS(XLINK_NS, "xlink:href", DROPDOWN_ICON_URL_BLACK);
      icon.setAttribute("x", button.width - Blockly.FlyoutButton.MARGIN - DROPDOWN_ICON_SIZE);
      icon.setAttribute("y", DROPDOWN_ICON_Y);
      icon.style.filter = "var(--editorDarkMode-palette-filter, none)";
      button.svgGroup_.appendChild(icon);
    };

    const oldFlyoutButtonInit = Blockly.FlyoutButton.prototype.init;
    Blockly.FlyoutButton.prototype.init = function (workspace, targetWorkspace, xml, isLabel) {
      oldFlyoutButtonInit.call(this, workspace, targetWorkspace, xml, isLabel);
      this._saId = xml.getAttribute("id");
    };

    const oldFlyoutButtonCreateDom = Blockly.FlyoutButton.prototype.createDom;
    Blockly.FlyoutButton.prototype.createDom = function () {
      const result = oldFlyoutButtonCreateDom.call(this);
      if (this._saId === "music") {
        this.targetWorkspace_.registerButtonCallback("SELECT_MIDI_OUTPUT", () => {
          toggleMidiDropdown(this._saMidiButton.svgGroup_, true);
        });
        const xmlDocument = document.implementation.createDocument(null, "xml");
        const buttonXml = xmlDocument.createElement("button");
        buttonXml.setAttribute("text", msg("midi-output"));
        buttonXml.setAttribute("callbackKey", "SELECT_MIDI_OUTPUT");
        this._saMidiButton = new Blockly.FlyoutButton(
          this.workspace_,
          this.targetWorkspace_,
          buttonXml,
          false
        );
        this._saMidiButton.createDom();
        this._saMidiButton.show();
        addDropdownIcon(this._saMidiButton);
        this._saMidiButton.svgGroup_.addEventListener("click", (e) => e.stopPropagation());
      }
      return result;
    };

    const oldFlyoutButtonMoveTo = Blockly.FlyoutButton.prototype.moveTo;
    Blockly.FlyoutButton.prototype.moveTo = function (x, y) {
      oldFlyoutButtonMoveTo.call(this, x, y);
      if (this._saId === "music") {
        const flyout = this.targetWorkspace_.getFlyout();
        const flyoutWidth = flyout.getWidth() / this.workspace_.scale;
        if (this.workspace_.RTL) {
          this._saMidiButton.moveTo(flyout.MARGIN, y);
        } else {
          this._saMidiButton.moveTo(flyoutWidth - flyout.MARGIN - this._saMidiButton.width, y);
        }
      }
    };

    const oldFlyoutButtonDispose = Blockly.FlyoutButton.prototype.dispose;
    Blockly.FlyoutButton.prototype.dispose = function () {
      oldFlyoutButtonDispose.call(this);
      if (this._saId === "music") {
        this._saMidiButton.dispose();
      }
    }
  }));

  // Project page
  while (true) {
    const musicInfo = await addon.tab.waitForElement("img[src$='extension-music.svg'] + .extension-content", {
      markAsSeen: true,
      reduxCondition: (state) => state.scratchGui.mode.isPlayerOnly,
    });
    const button = Object.assign(document.createElement("button"), {
      type: "button",
      className: "extension-action sa-midi-button",
      innerText: msg("midi-output"),
    });
    musicInfo.appendChild(button);
    button.appendChild(Object.assign(document.createElement("img"), {
      src: DROPDOWN_ICON_URL_WHITE,
    }));
    button.addEventListener("click", (e) => {
      toggleMidiDropdown(button, false);
      e.stopPropagation();
    });
  }
}
