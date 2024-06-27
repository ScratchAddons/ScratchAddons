import { escapeHTML } from "../../libraries/common/cs/autoescaper.js";

const defaultColor = {
  color: "#29beb8",
  secondaryColor: "#3aa8a4",
  tertiaryColor: "#3aa8a4",
};

const highContrastColor = {
  color: "#34e4d0",
  secondaryColor: "#229487",
  tertiaryColor: "#229487",
};

const customColor = {};

export const setCustomBlockColor = (newColor) => {
  Object.assign(customColor, newColor);
};

const DEFAULT_ICON =
  "data:image/svg+xml;base64," +
  btoa(
    `<svg width="20" height="20" viewBox="0 0 5.292 5.292" xmlns="http://www.w3.org/2000/svg"><g stroke="#4c97ff" fill="none" fill-rule="evenodd" stroke-linecap="round" stroke-linejoin="round" transform="matrix(.26458 0 0 .26458 -.375 -.661)"><rect style="fill:#29beb8;fill-opacity:1;stroke:none;stroke-width:.919866;stroke-linecap:square;stroke-opacity:1" width="15" height="11" x="2.5" y="3.5" rx="2" ry="2" stroke="none"/><path d="M5.417 6.5 9.167 9l-3.75 2.5m5 0h4.166" style="fill:none;stroke:#fff;stroke-width:1;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1"/></g><g transform="matrix(.00737 0 0 .00754 2.183 2.117)"><circle cx="193" cy="193" r="193" fill="#ff7b26"/><path fill="#fff" d="M253.276 243.45c-10.016 27.852-37.244 44.78-80.907 50.32a63.33 63.33 0 0 1-5.892.467c-2.543 3.734-5.861 6.97-9.769 9.491-10.233 6.567-19.816 9.772-29.274 9.772-19.444 0-40.376-14.564-40.376-46.555 0-2.178.094-5.01.31-8.931.095-1.68.187-2.988.218-3.952a34.65 34.65 0 0 1-.807-7.376v-15.062c0-2.458.249-4.916.744-7.375.036-2.085.125-4.419.28-6.97-.745-2.74-1.303-5.913-1.303-9.461 0-1.618.124-3.236.341-4.823 1.178-8.34 4.869-16.712 11.102-23.402a56.07 56.07 0 0 1-3.256-18.859v-15.87c0-6.443 1.271-14.471 7.504-34.45 2.605-8.59 3.442-11.265 4.59-13.755 6.109-13.755 15.32-20.632 22.018-24.024 10.946-5.477 22.7-8.278 34.918-8.278 5.644 0 11.04.592 16.187 1.712a41.705 41.705 0 0 1 7.35-3.953c3.318-1.431 6.853-2.427 10.76-3.05 9.77-1.68 20.096.405 29.089 5.882 9.458 5.789 20.312 17.8 18.978 42.51-.216 4.356-.59 10.176-1.147 17.769-.035.187-.035.373-.059.56-.495 5.508-1.21 13.723-2.17 24.584.248 4.201.154 8.9-.217 14.44a33.182 33.182 0 0 1-1.055 6.286c-.124.467-.249.902-.373 1.307a67.737 67.737 0 0 1 8.993 15.435c1.83 3.703 3.38 7.967 4.745 13.164.528 1.96.869 3.952 1.023 5.975 1.396 17.458.682 27.758-2.543 36.472z" style="mix-blend-mode:normal"/><path fill="#ff7b26" d="M221.91 210.395c1.964 12.923.872 28.714-11.653 36.1-13.799 10.046-31.412 13.367-48.107 14.013-9.546.74-20.833-12.396-24.471-12.68-1.056 10.014 7.137 26.763-5.062 31.5-14.159 1.809-11.71-13.374-11.01-22.446-.393-12.27-1.32-24.64.625-36.813-3.495-9.48 1.132-24.515 13.736-18.4 7.661 8.362 2.739 22.042 10.767 30.698 5.968 9.084 15.669 18.308 27.508 15.561 10.625-2.76 23.235-4.812 30.26-14.088 9.018-15.73-1.836-38.874-20.17-40.952-15.4-3.719-33.615-.653-46.024-12.597-9.555-7.667-10.392-20.443-9.511-31.703 1.142-13.568 5.271-26.81 10.366-39.347 8.154-10.912 24.537-11.62 36.624-8.149 9.19.52 14.162 13.427 20.375 13.83 1.7-7.273-3.688-23.833 10.528-20.795 10.736 5.787 3.195 20.031 4.226 29.64-1.131 13.07-2.616 26.152-2.353 39.293-5.531 11.863-21.7 1.166-17.096-9.585-2.201-13.487-8.789-25.934-15.96-37.343-7.65-8.212-23.715-4.451-24.343 7.614-4.487 14.294-10.27 31.343-1.8 45.25 10.054 11.16 26.486 6.515 39.53 10.361 16.061 2.782 29.742 14.75 33.015 31.038z" style="mix-blend-mode:normal"/><path fill="#ff7b26" d="M161.5 214.5h138v113h-138z"/><path d="M194.5 232.5v15h-10v80h115v-80h-10v-15h-32v15h-31v-15z" fill="#fff"/></g></svg>`
  );

const HIGH_CONTRAST_ICON =
  "data:image/svg+xml;base64," +
  btoa(
    `<svg width="20" height="20" viewBox="0 0 5.292 5.292" xmlns="http://www.w3.org/2000/svg"><g stroke="#4c97ff" fill="none" fill-rule="evenodd" stroke-linecap="round" stroke-linejoin="round" transform="matrix(.26458 0 0 .26458 -.375 -.661)"><rect style="fill:#229487;fill-opacity:1;stroke:none;stroke-width:.919866;stroke-linecap:square;stroke-opacity:1" width="15" height="11" x="2.5" y="3.5" rx="2" ry="2" stroke="none"/><path d="M5.417 6.5 9.167 9l-3.75 2.5m5 0h4.166" style="fill:none;stroke:#fff;stroke-width:1;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1"/></g><g transform="matrix(.00737 0 0 .00754 2.183 2.117)"><circle cx="193" cy="193" r="193" fill="#ff7b26"/><path fill="#fff" d="M253.276 243.45c-10.016 27.852-37.244 44.78-80.907 50.32a63.33 63.33 0 0 1-5.892.467c-2.543 3.734-5.861 6.97-9.769 9.491-10.233 6.567-19.816 9.772-29.274 9.772-19.444 0-40.376-14.564-40.376-46.555 0-2.178.094-5.01.31-8.931.095-1.68.187-2.988.218-3.952a34.65 34.65 0 0 1-.807-7.376v-15.062c0-2.458.249-4.916.744-7.375.036-2.085.125-4.419.28-6.97-.745-2.74-1.303-5.913-1.303-9.461 0-1.618.124-3.236.341-4.823 1.178-8.34 4.869-16.712 11.102-23.402a56.07 56.07 0 0 1-3.256-18.859v-15.87c0-6.443 1.271-14.471 7.504-34.45 2.605-8.59 3.442-11.265 4.59-13.755 6.109-13.755 15.32-20.632 22.018-24.024 10.946-5.477 22.7-8.278 34.918-8.278 5.644 0 11.04.592 16.187 1.712a41.705 41.705 0 0 1 7.35-3.953c3.318-1.431 6.853-2.427 10.76-3.05 9.77-1.68 20.096.405 29.089 5.882 9.458 5.789 20.312 17.8 18.978 42.51-.216 4.356-.59 10.176-1.147 17.769-.035.187-.035.373-.059.56-.495 5.508-1.21 13.723-2.17 24.584.248 4.201.154 8.9-.217 14.44a33.182 33.182 0 0 1-1.055 6.286c-.124.467-.249.902-.373 1.307a67.737 67.737 0 0 1 8.993 15.435c1.83 3.703 3.38 7.967 4.745 13.164.528 1.96.869 3.952 1.023 5.975 1.396 17.458.682 27.758-2.543 36.472z" style="mix-blend-mode:normal"/><path fill="#ff7b26" d="M221.91 210.395c1.964 12.923.872 28.714-11.653 36.1-13.799 10.046-31.412 13.367-48.107 14.013-9.546.74-20.833-12.396-24.471-12.68-1.056 10.014 7.137 26.763-5.062 31.5-14.159 1.809-11.71-13.374-11.01-22.446-.393-12.27-1.32-24.64.625-36.813-3.495-9.48 1.132-24.515 13.736-18.4 7.661 8.362 2.739 22.042 10.767 30.698 5.968 9.084 15.669 18.308 27.508 15.561 10.625-2.76 23.235-4.812 30.26-14.088 9.018-15.73-1.836-38.874-20.17-40.952-15.4-3.719-33.615-.653-46.024-12.597-9.555-7.667-10.392-20.443-9.511-31.703 1.142-13.568 5.271-26.81 10.366-39.347 8.154-10.912 24.537-11.62 36.624-8.149 9.19.52 14.162 13.427 20.375 13.83 1.7-7.273-3.688-23.833 10.528-20.795 10.736 5.787 3.195 20.031 4.226 29.64-1.131 13.07-2.616 26.152-2.353 39.293-5.531 11.863-21.7 1.166-17.096-9.585-2.201-13.487-8.789-25.934-15.96-37.343-7.65-8.212-23.715-4.451-24.343 7.614-4.487 14.294-10.27 31.343-1.8 45.25 10.054 11.16 26.486 6.515 39.53 10.361 16.061 2.782 29.742 14.75 33.015 31.038z" style="mix-blend-mode:normal"/><path fill="#ff7b26" d="M161.5 214.5h138v113h-138z"/><path d="M194.5 232.5v15h-10v80h115v-80h-10v-15h-32v15h-31v-15z" fill="#fff"/></g></svg>`
  );

let vm;
const customBlocks = {};
const customBlockParamNamesIdsDefaults = Object.create(null);

export const getCustomBlock = (proccode) => {
  if (!Object.prototype.hasOwnProperty.call(customBlocks, proccode)) {
    return;
  }
  return customBlocks[proccode];
};

const getArgumentId = (index) => `arg${index}`;

const getNamesIdsDefaults = (blockData) => [
  blockData.args,
  blockData.args.map((_, i) => getArgumentId(i)),
  blockData.args.map(() => ""),
];

// This needs to function exactly as Scratch does:
// https://github.com/scratchfoundation/scratch-blocks/blob/abbfe93136fef57fdfb9a077198b0bc64726f012/blocks_vertical/procedures.js#L207-L215
// Returns a list like ["%s", "%d"]
const parseArguments = (code) =>
  code
    .split(/(?=[^\\]%[nbs])/g)
    .map((i) => i.trim())
    .filter((i) => i.charAt(0) === "%")
    .map((i) => i.substring(0, 2));

// Ensures all arguments have whitespace before them so that Scratch parses it correctly.
// "test%s" -> "test %s"
const fixDisplayName = (displayName) => displayName.replace(/([^\s])(%[nbs])/g, (_, before, arg) => `${before} ${arg}`);
const compareArrays = (a, b) => JSON.stringify(a) === JSON.stringify(b);

let workspaceUpdateQueued = false;
const queueWorkspaceUpdate = () => {
  if (workspaceUpdateQueued) {
    return;
  }
  workspaceUpdateQueued = true;
  queueMicrotask(() => {
    workspaceUpdateQueued = false;
    if (vm.editingTarget) {
      vm.emitWorkspaceUpdate();
    }
  });
};

export const addBlock = (proccode, { args, callback, hidden, displayName }) => {
  if (getCustomBlock(proccode)) {
    return;
  }

  // Make sure that the argument counts all appear to be consistent.
  // Any inconsistency may result in various strange behaviors, possibly including corruption.
  const procCodeArguments = parseArguments(proccode);
  if (args.length !== procCodeArguments.length) {
    throw new Error("Procedure code and argument list do not match");
  }
  if (displayName) {
    displayName = fixDisplayName(displayName);
    // Make sure that the display name has the same arguments as the actual procedure code
    const displayNameArguments = parseArguments(displayName);
    if (!compareArrays(procCodeArguments, displayNameArguments)) {
      console.warn(`block displayName ${displayName} for ${proccode} does not have matching arguments, ignoring it.`);
      displayName = proccode;
    }
  } else {
    displayName = proccode;
  }

  const blockData = {
    id: proccode,
    args,
    handler: callback,
    hide: !!hidden,
    displayName,
  };
  customBlocks[proccode] = blockData;
  customBlockParamNamesIdsDefaults[proccode] = getNamesIdsDefaults(blockData);
  queueWorkspaceUpdate();
};

export const removeBlock = (proccode) => {
  customBlocks[proccode] = null;
  customBlockParamNamesIdsDefaults[proccode] = null;
};

const generateBlockXML = () => {
  let xml = "";
  for (const proccode of Object.keys(customBlocks)) {
    const blockData = customBlocks[proccode];
    if (blockData.hide) continue;
    const [names, ids, defaults] = getNamesIdsDefaults(blockData);
    xml +=
      '<block type="procedures_call" gap="16"><mutation generateshadows="true" warp="false"' +
      ` proccode="${escapeHTML(proccode)}"` +
      ` argumentnames="${escapeHTML(JSON.stringify(names))}"` +
      ` argumentids="${escapeHTML(JSON.stringify(ids))}"` +
      ` argumentdefaults="${escapeHTML(JSON.stringify(defaults))}"` +
      "></mutation></block>";
  }
  if (xml.length === 0) {
    const message = scratchAddons.l10n.get("noAddedBlocks", null, "No addons have added blocks.");
    return `<label text="${escapeHTML(message)}" showStatusButton="null" />`;
  }
  return xml;
};

const injectWorkspace = (ScratchBlocks) => {
  const BlockSvg = ScratchBlocks.BlockSvg;
  const oldUpdateColour = BlockSvg.prototype.updateColour;
  BlockSvg.prototype.updateColour = function (...args) {
    // procedures_prototype also have a procedure code but we do not want to color them.
    if (!this.isInsertionMarker() && this.type === "procedures_call") {
      const block = this.procCode_ && getCustomBlock(this.procCode_);
      const color = ScratchBlocks.Colours.text === "#000000" ? highContrastColor : defaultColor;
      if (block) {
        this.colour_ = customColor.color || color.color;
        this.colourSecondary_ = customColor.secondaryColor || color.secondaryColor;
        this.colourTertiary_ = customColor.tertiaryColor || color.tertiaryColor;
        this.customContextMenu = null;
      }
    }
    return oldUpdateColour.call(this, ...args);
  };

  // We use Scratch's extension category mechanism to create a new category.
  // https://github.com/scratchfoundation/scratch-gui/blob/ddd2fa06f2afa140a46ec03be91796ded861e65c/src/containers/blocks.jsx#L344
  // https://github.com/scratchfoundation/scratch-vm/blob/a0c11d6d8664a4f2d55632e70630d09ec6e9ae28/src/engine/runtime.js#L1381
  const originalGetBlocksXML = vm.runtime.getBlocksXML;
  vm.runtime.getBlocksXML = function (target) {
    const result = originalGetBlocksXML.call(this, target);
    result.unshift({
      id: "sa-blocks",
      xml:
        "<category" +
        ` name="${escapeHTML(scratchAddons.l10n.get("debugger/@name", null, "Debugger"))}"` +
        ' id="sa-blocks"' +
        ' colour="#ff7b26"' +
        ' secondaryColour="#ff7b26"' +
        ` iconURI="${ScratchBlocks.Colours.text === "#000000" ? HIGH_CONTRAST_ICON : DEFAULT_ICON}"` +
        `>${generateBlockXML()}</category>`,
    });
    return result;
  };

  // Trick Scratch into thinking addon blocks are defined somewhere.
  // This makes Scratch's "is this procedure used anywhere" check work when addon blocks exist.
  // getDefineBlock is used in https://github.com/scratchfoundation/scratch-blocks/blob/37f12ae3e342480f4d8e7b6ba783c46e29e77988/core/block_dragger.js#L275-L297
  // and https://github.com/scratchfoundation/scratch-blocks/blob/develop/core/procedures.js
  // Only block_dragger.js should be able to reference addon blocks, but if procedures.js does
  // somehow, we shim enough of the API that things shouldn't break.
  const originalGetDefineBlock = ScratchBlocks.Procedures.getDefineBlock;
  ScratchBlocks.Procedures.getDefineBlock = function (procCode, workspace) {
    // If an actual definition with this code exists, return that instead of our shim.
    const result = originalGetDefineBlock.call(this, procCode, workspace);
    if (result) {
      return result;
    }
    const block = getCustomBlock(procCode);
    if (block) {
      return {
        workspace,
        getInput() {
          return {
            connection: {
              targetBlock() {
                return null;
              },
            },
          };
        },
      };
    }
    return result;
  };

  const originalCreateAllInputs = ScratchBlocks.Blocks["procedures_call"].createAllInputs_;
  ScratchBlocks.Blocks["procedures_call"].createAllInputs_ = function (...args) {
    const blockData = getCustomBlock(this.procCode_);
    if (blockData) {
      const originalProcCode = this.procCode_;
      this.procCode_ = blockData.displayName;
      const ret = originalCreateAllInputs.call(this, ...args);
      this.procCode_ = originalProcCode;
      return ret;
    }
    return originalCreateAllInputs.call(this, ...args);
  };

  // Workspace update may be required to make category appear in flyout
  queueWorkspaceUpdate();
};

let inited = false;
export async function init(tab) {
  if (inited) {
    return;
  }
  inited = true;

  if (!tab.editorMode) {
    return;
  }

  vm = tab.traps.vm;

  const Blocks = vm.runtime.monitorBlocks.constructor;
  // Worth noting that this adds a very slight overhead to every procedure call.
  // However, it's not significant and is basically unmeasurable.
  const originalGetProcedureParamNamesIdsAndDefaults = Blocks.prototype.getProcedureParamNamesIdsAndDefaults;
  Blocks.prototype.getProcedureParamNamesIdsAndDefaults = function getProcedureParamNamesIdsAndDefaultsWrapped(name) {
    return customBlockParamNamesIdsDefaults[name] || originalGetProcedureParamNamesIdsAndDefaults.call(this, name);
  };

  const oldStepToProcedure = vm.runtime.sequencer.stepToProcedure;
  vm.runtime.sequencer.stepToProcedure = function (thread, proccode) {
    const blockData = getCustomBlock(proccode);
    if (blockData) {
      const stackFrame = thread.peekStackFrame();
      blockData.handler(stackFrame.params, thread);
      // Don't call old stepToProcedure. It won't work correctly.
      // Something to consider is that this may allow projects to figure out if a user has an addon enabled.
      return;
    }
    return oldStepToProcedure.call(this, thread, proccode);
  };

  const ScratchBlocks = await tab.traps.getBlockly();
  injectWorkspace(ScratchBlocks);
}
