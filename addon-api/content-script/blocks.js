import { escapeHTML } from "../../libraries/common/cs/autoescaper.js";

const color = {
  color: "#29beb8",
  secondaryColor: "#3aa8a4",
  tertiaryColor: "#3aa8a4",
};

const ICON =
  "data:image/svg+xml;," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 386 386"><circle cx="193" cy="193" r="193" fill="#ff7b26"/><path fill="#fff" d="M253.276 243.45c-10.016 27.852-37.244 44.78-80.907 50.32a63.33 63.33 0 01-5.892.467c-2.543 3.734-5.861 6.97-9.769 9.491-10.233 6.567-19.816 9.772-29.274 9.772-19.444 0-40.376-14.564-40.376-46.555 0-2.178.094-5.01.31-8.931.095-1.68.187-2.988.218-3.952a34.65 34.65 0 01-.807-7.376v-15.062c0-2.458.249-4.916.744-7.375.036-2.085.125-4.419.28-6.97-.745-2.74-1.303-5.913-1.303-9.461 0-1.618.124-3.236.341-4.823 1.178-8.34 4.869-16.712 11.102-23.402a56.07 56.07 0 01-3.256-18.859v-15.87c0-6.443 1.271-14.471 7.504-34.45 2.605-8.59 3.442-11.265 4.59-13.755 6.109-13.755 15.32-20.632 22.018-24.024 10.946-5.477 22.7-8.278 34.918-8.278 5.644 0 11.04.592 16.187 1.712a41.705 41.705 0 017.35-3.953c3.318-1.431 6.853-2.427 10.76-3.05 9.77-1.68 20.096.405 29.089 5.882 9.458 5.789 20.312 17.8 18.978 42.51-.216 4.356-.59 10.176-1.147 17.769-.035.187-.035.373-.059.56-.495 5.508-1.21 13.723-2.17 24.584.248 4.201.154 8.9-.217 14.44a33.182 33.182 0 01-1.055 6.286c-.124.467-.249.902-.373 1.307a67.737 67.737 0 018.993 15.435c1.83 3.703 3.38 7.967 4.745 13.164.528 1.96.869 3.952 1.023 5.975 1.396 17.458.682 27.758-2.543 36.472z" style="mix-blend-mode:normal"/><path fill="#ff7b26" d="M221.91 210.395c.908 11.318.722 18.613-.547 21.899-5.278 14.965-23.01 24.36-53.19 28.194-10.186 1.28-20.367-3.557-30.554-14.508 0 1.643.363 6.57 1.094 14.785.547 6.022.453 10.948-.273 14.779-4.55 2.919-8.184 4.381-10.912 4.381-4.187 0-6.274-4.104-6.274-12.32 0-1.46.094-3.784.273-6.977.18-3.19.273-5.427.273-6.706 0-3.103-.273-5.29-.819-6.57v-15.055c0-.365.094-.775.273-1.232.18-.454.362-.866.546-1.233-.183-2.552-.094-6.476.273-11.77.362-3.285.362-5.38 0-6.295-.912-1.82-1.361-2.916-1.361-3.283.723-5.11 4.456-7.665 11.182-7.665 4.364 0 7 1.553 7.911 4.653 0 2.919.364 7.21 1.091 12.865 1.095 6.569 4.547 13.141 10.367 19.708 6.364 7.484 12.454 10.95 18.278 10.403 6.546-.725 13.093-2.278 19.64-4.652 9.092-3.287 14.546-7.117 16.367-11.496 1.268-3.286 1.907-6.75 1.907-10.403 0-11.129-4.09-19.434-12.274-24.908-3.64-2.372-10.367-4.289-20.188-5.751-5.638-.725-9.096-1.095-10.364-1.095-8.73.183-16.87-2.645-24.415-8.487-7.548-5.838-11.319-12.594-11.319-20.258v-15.874c0-3.464 2-11.586 6.004-24.36 1.814-6.026 2.816-9.215 3.002-9.583 1.634-3.83 3.724-6.385 6.27-7.664 6.18-3.1 12.727-4.653 19.64-4.653 13.455 0 23.366 5.474 29.732 16.422.547.548 1.455 1.37 2.73 2.465.179-2.552.546-6.476 1.09-11.77a1309.62 1309.62 0 00-.545-6.843c0-2.552 1.268-4.285 3.817-5.2.725-.363 1.727-.637 3.002-.82 1.817-.366 3.774.093 5.867 1.365 2.087 1.28 2.952 5.113 2.59 11.496-.183 4.014-.547 9.672-1.092 16.97-.546 6.024-1.361 15.239-2.456 27.649.364 2.919.364 6.937 0 12.043-.912 3.467-3.64 5.2-8.184 5.2-2.366 0-4.636-.637-6.819-1.913-1.091-3.464-1.634-4.93-1.634-4.382.36-4.926-.639-11.496-3.002-19.708-2.003-4.195-4.772-10.17-8.32-17.928-3.548-7.755-8.23-11.91-14.048-12.457-7.275-.548-12.001 1.917-14.184 7.39-.726 2.375-1.73 5.845-3 10.404-2.182 6.753-3.547 13.232-4.093 19.434-.182 2.01-.365 2.832-.546 2.465a228.34 228.34 0 001.91 10.95c.909 4.563 3.139 8.033 6.683 10.4 3.548 2.375 10.318 3.832 20.322 4.38 24.548 1.465 39.73 10.042 45.551 25.732.906 1.463 1.815 3.924 2.726 7.388z" style="mix-blend-mode:normal"/><path fill="#ff7b26" d="M161.5 214.5h138v113h-138z"/><path d="M194.5 232.5v15h-10v80h115v-80h-10v-15h-32v15h-31v-15z" fill="#fff"/></svg>`
  );

let vm;
const customBlocks = {};
const customBlockParamNamesIdsDefaults = Object.create(null);

const getCustomBlock = (proccode) => {
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
// https://github.com/LLK/scratch-blocks/blob/abbfe93136fef57fdfb9a077198b0bc64726f012/blocks_vertical/procedures.js#L207-L215
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
    color: color.color,
    secondaryColor: color.secondaryColor,
    tertiaryColor: color.tertiaryColor,
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
    if (this.type === "procedures_call") {
      const block = this.procCode_ && getCustomBlock(this.procCode_);
      if (block) {
        this.colour_ = block.color;
        this.colourSecondary_ = block.secondaryColor;
        this.colourTertiary_ = block.tertiaryColor;
        this.customContextMenu = null;
      }
    }
    return oldUpdateColour.call(this, ...args);
  };

  // We use Scratch's extension category mechanism to create a new category.
  // https://github.com/LLK/scratch-gui/blob/ddd2fa06f2afa140a46ec03be91796ded861e65c/src/containers/blocks.jsx#L344
  // https://github.com/LLK/scratch-vm/blob/a0c11d6d8664a4f2d55632e70630d09ec6e9ae28/src/engine/runtime.js#L1381
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
        ` iconURI="${ICON}"` +
        `>${generateBlockXML()}</category>`,
    });
    return result;
  };

  // Trick Scratch into thinking addon blocks are defined somewhere.
  // This makes Scratch's "is this procedure used anywhere" check work when addon blocks exist.
  // getDefineBlock is used in https://github.com/LLK/scratch-blocks/blob/37f12ae3e342480f4d8e7b6ba783c46e29e77988/core/block_dragger.js#L275-L297
  // and https://github.com/LLK/scratch-blocks/blob/develop/core/procedures.js
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
