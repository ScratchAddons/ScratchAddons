import { addDefaultAssetFolderIfMissing } from "../folders/userscript.js";
import { assetSelect, createAndAppendElement } from "./utils.js";

export default async function ({ addon, console, msg }) {
  function createAssetConflictDialog(fileName, actionClickCallback) {
    // Create the modal
    const { remove, content, closeButton, container } = addon.tab.createModal(msg("title"), {
      isOpen: true,
      useEditorClasses: true,
    });
    container.classList.add("conflictDialog");

    // Add the modal content
    const btnContainerClass = addon.tab.scratchClass("prompt_button-row", { others: "conflictDialog-actions" });
    const selectedClass = addon.tab.scratchClass("prompt_ok-button");

    createAndAppendElement("p", content, { textContent: msg("dialogText", { fileName: `"${fileName}"` }) });
    const btnContainer = createAndAppendElement("div", content, { className: btnContainerClass });
    const buttons = ["rename", "replace", "skip"].map((action) =>
      createAndAppendElement("button", btnContainer, {
        name: action,
        value: action,
        textContent: msg(action),
        className: action === "rename" ? selectedClass : "",
      })
    );
    conflictFooter = createAndAppendElement("div", content, { className: "conflictDialog-footer" });
    applyToAllCheckbox = createAndAppendElement("input", conflictFooter, {
      type: "checkbox",
      id: "applyToAll",
      name: "applyToAll",
    });
    createAndAppendElement("label", conflictFooter, { htmlFor: "applyToAll", textContent: msg("applyToAll") });

    // initially hide the conflictFooter so that later, asynchronously, when multiple conflicts are in the conflictQueue we can show it again
    if (!conflictQueue.length) {
      conflictFooter.style.display = "none";
    }

    buttons.forEach((btn) => {
      btn.addEventListener("click", function () {
        buttons.forEach((btn) => btn.classList.remove("selected"));
        this.classList.add("selected");
        // Logic to handle the confirmation action
        actionClickCallback(this.value, applyToAllCheckbox.checked);
        remove(); // Then close the modal
      });
    });
    closeButton.addEventListener("click", () => {
      conflictChainStarted = false;
      // if the modal is closed apply vanilla scratch
      actionClickCallback("skip", true);
      remove();
    });
  }

  function createShareAssetWithFileConflictModal(originalShareFn, type) {
    return function (...args) {
      // handle dynamic enable/disable
      if (addon.self.disabled) return originalShareFn.call(this, ...args);

      // https://github.com/scratchfoundation/scratch-vm/blob/6c8079147571b7289a8ddf120a6c324c3c228d54/src/virtual-machine.js#L1290
      // the method is a little hacky but we're going to call the original code up to the part it creates the clone
      // then we'll simply swap to the already polluted addCostume and addSound functions
      const [assetIndex, targetId] = args;
      const originalAsset = (type === "costume" ? this.editingTarget.getCostumes() : this.editingTarget.getSounds())[
        assetIndex
      ];
      const clone = Object.assign({}, originalAsset);
      if (type === "costume") {
        const md5ext = `${clone.assetId}.${clone.dataFormat}`;
        return this.addCostume.call(this, md5ext, clone, targetId, 3);
      } else {
        return this.addSound.call(this, clone, targetId);
      }
    };
  }

  function wrapAddAssetWithFileConflictModal(originalFn, type) {
    return function (...args) {
      // `this` is a VirtualMachine

      // handle dynamic enable/disable
      if (addon.self.disabled) return originalFn.call(this, ...args);

      // get args
      const optTargetId =
        type === "costume" ? args[2] : type === "backdrop" ? this.runtime.getTargetForStage() : args[1];
      // the only difference between backdrop and costume is backdrop has stage as target id
      if (type == "backdrop") type = "costume";
      const assetObj = type === "costume" ? args[1] : args[0];

      // handle new costume or sound via Paint/Record
      // abuses the fact that new costumes don't have an asset property and new sounds have a format property set to ""
      const isNewAsset =
        (type === "costume" && !assetObj.asset && assetObj?.skinId === null) ||
        (type === "sound" && assetObj.format === "" && !assetObj.asset.clean);
      if (isNewAsset) return originalFn.call(this, ...args);

      // folders addon compatibility
      addDefaultAssetFolderIfMissing(assetObj);

      // get target and target.sprite
      const target = optTargetId ? this.runtime.getTargetById(optTargetId) : this.editingTarget;
      if (!target) return originalFn.call(this, ...args);
      const sprite = target.sprite;

      // see if there is even a conflict
      const assets = type === "costume" ? sprite.costumes_ : sprite.sounds;
      const originalName = assetObj.name || "";
      const isConflicting = !!assets.find((i) => i.name === originalName);
      if (!isConflicting) return originalFn.call(this, ...args);

      // Return a new Promise
      return new Promise((resolve, reject) => {
        // if there's a conflict, we need to wait for the user to make a choice in the modal dialog before we can act on this
        // Note: as the outer function is not async we can't use await
        // instead we'll create a callback that will handle the conflict once the modal is submitted and push to the conflictQueue
        const conflictHandler = (action) => {
          switch (action) {
            case "rename":
              resolve(originalFn.call(this, ...args));
              break;
            case "replace": {
              resolve(
                originalFn.call(this, ...args).then(() => {
                  // Don't reuse values from above as they may have changed
                  const assets = type === "costume" ? sprite.costumes_ : sprite.sounds;
                  const assetObjIndex = assets.findIndex((e) => e === assetObj);
                  const duplicateIndex = assets.findIndex((e) => e.name === originalName);
                  assets[duplicateIndex] = assets[assetObjIndex];
                  assets[duplicateIndex].name = originalName;
                  if (type === "costume") {
                    target.setCostume(duplicateIndex);
                    target.sprite.deleteCostumeAt(assetObjIndex);
                  } else {
                    target.deleteSound(assetObjIndex);
                  }

                  // force asset list to update immediately, don't wait for the next Scratch frame
                  this.emitTargetsUpdate();

                  // if we are on the same tab as we added the costume to, set the tabs current asset state to the duplicate asset
                  if (this.runtime._editingTarget === target) {
                    assetSelect(addon, duplicateIndex, type);
                  }
                })
              );
              break;
            }
            case "skip":
              resolve(assetObj);
              break;
          }
        };
        conflictQueue.push({ assetName: originalName, conflictHandler: conflictHandler });
        if (conflictFooter && conflictChainStarted) {
          conflictFooter.style.display = "block";
        }

        // to avoid polluting any other functions we begin the dequeuing function from within the wrapper function
        // this function sets off a recursive-callback chain which only ends once the queue is empty, so to avoid duplicate chains we only call it if the chain hasn't started
        if (!conflictChainStarted) {
          conflictChainStarted = true;
          dequeueConflictModal();
        }
      });
    };
  }

  function dequeueConflictModal() {
    // handle base case
    if (conflictQueue.length === 0) {
      applyToAll = false;
      conflictChainStarted = false;
      return;
    }

    // dequeue conflict from the conflictQueue
    const { assetName, conflictHandler } = conflictQueue.shift();

    // handle the case that applyToAll is set
    if (applyToAll) {
      conflictHandler(action);
      dequeueConflictModal();
      return;
    }

    createAssetConflictDialog(assetName, (action_, applyToAll_) => {
      // apply the chosen conflict resolution action
      conflictHandler(action_);

      // set applyToAll and it's corresponding action
      if (applyToAll_) {
        applyToAll = true;
        action = action_;
      }

      // call the next conflict in the chain
      dequeueConflictModal();
    });
  }

  // global vars needed for async functionality
  const vm = addon.tab.traps.vm;
  let conflictQueue = [];
  let applyToAll = false;
  let action = null;
  let conflictChainStarted = false;
  let conflictFooter = null;
  let applyToAllCheckbox = null;

  // pollute the costume and sound adding code to handle the replace/skip actions for assets
  vm.addCostume = wrapAddAssetWithFileConflictModal(vm.addCostume, "costume");
  vm.addSound = wrapAddAssetWithFileConflictModal(vm.addSound, "sound");
  vm.addBackdrop = wrapAddAssetWithFileConflictModal(vm.addBackdrop, "backdrop");
  vm.shareCostumeToTarget = createShareAssetWithFileConflictModal(vm.shareCostumeToTarget, "costume");
  vm.shareSoundToTarget = createShareAssetWithFileConflictModal(vm.shareSoundToTarget, "sound");
}
