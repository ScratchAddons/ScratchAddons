// util function for creating and appending Elements
function createAndAppendElement(type, parent, { textContent, ...attrs } = {}) {
  const element = document.createElement(type);
  if (textContent) attrs.textContent = textContent;
  Object.assign(element, attrs);
  parent.appendChild(element);
  return element;
}

export default async function ({ addon, console, msg }) {
  function createAssetConflictDialog(fileName, actionClickCallback) {
    // HTML content for the modal
    const btnContainerClass = addon.tab.scratchClass("prompt_button-row", { others: "conflictDialog-actions" });
    const selectedClass = addon.tab.scratchClass("prompt_ok-button");

    // Create the modal
    const { remove, content, closeButton, container } = addon.tab.createModal(msg("title"), {
      isOpen: true,
      useEditorClasses: true,
    });
    container.classList.add("conflictDialog");

    // Add the modal content
    createAndAppendElement("p", content, { textContent: msg("dialogText", { fileName: `"${fileName}"` }) });
    const btnContainer = createAndAppendElement("div", content, { className: btnContainerClass });
    const buttons = ["rename", "replace", "skip"].map(action =>
      createAndAppendElement("button", btnContainer, {
        name: action,
        value: action,
        textContent: msg(action),
        className: action === "rename" ? selectedClass : ""
      })
    );
    conflictFooter = createAndAppendElement("div", content, { className: "conflictDialog-footer" });
    applyToAllCheckbox = createAndAppendElement("input", conflictFooter, {
      type: "checkbox",
      id: "applyToAll",
      name: "applyToAll",
    });
    createAndAppendElement("label", conflictFooter, { for: "applyToAll", textContent: msg("applyToAll") });

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

  function wrapAddAssetWithFileConflictModal(originalFn, type) {
    return function (...args) {
      // Return a new Promise
      return new Promise((resolve, reject) => {
        //get args
        const optTargetId = type === "costume" ? args[2] : args[1];
        const assetObj = type === "costume" ? args[1] : args[0];

        // get target and target.sprite
        const target = optTargetId ? this.runtime.getTargetById(optTargetId) : this.editingTarget;
        if (!target) return resolve(originalFn.call(this, ...args));
        const sprite = target.sprite;

        // check if the new asset will be renamed by adding a dummy asset and testing if it gets renamed
        const originalName = assetObj.name;
        type === "costume" ? target.addCostume(assetObj) : target.addSound(assetObj);
        const newName = assetObj.name;

        // remove the dummy asset we previously added
        if (type === "costume") {
          sprite.costumes_ = sprite.costumes_.filter((e) => e.name !== newName);
        } else {
          sprite.sounds = sprite.sounds.filter((e) => e.name !== newName);
        }

        // if the name is the same, there are no duplicates so we let the originalFn proceed as normal
        if (newName === originalName) return resolve(originalFn.call(this, ...args));

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
                  const assets = type === "costume" ? sprite.costumes_ : sprite.sounds;
                  const assetObjIndex = assets.findIndex((e) => e.name === newName);
                  const duplicateIndex = assets.findIndex((e) => e.name === originalName);
                  assets[duplicateIndex] = assets[assetObjIndex];
                  assets[duplicateIndex].name = originalName;
                  type === "costume" ? vm.deleteCostume(assetObjIndex) : vm.deleteSound(assetObjIndex);
                })
              );
              break;
            }
            case "skip":
              resolve(assetObj);
              break;
          }
        };
        conflictQueue.push({ assetName: `${originalName}.${assetObj.dataFormat}`, conflictHandler: conflictHandler });
        if (conflictQueue.length && conflictFooter && conflictChainStarted) {
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

  const vm = addon.tab.traps.vm;
  let conflictQueue = [];
  let applyToAll = false;
  let action = null;
  let conflictChainStarted = false;
  let conflictFooter = null;
  let applyToAllCheckbox = null;

  // pollute the costume and sound adding code to handle the replace/skip actions for assets
  const originalAddCostume = vm.addCostume;
  const originalAddSound = vm.addSound;
  vm.addCostume = wrapAddAssetWithFileConflictModal(originalAddCostume, "costume");
  vm.addSound = wrapAddAssetWithFileConflictModal(originalAddSound, "sound");
}
