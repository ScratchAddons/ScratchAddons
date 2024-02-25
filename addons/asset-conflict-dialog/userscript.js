export default async function ({ addon, console }) {

  // https://github.com/scratchfoundation/scratch-vm/blob/44d8d535414a70b77c1cab4aa4d2c47397d0180c/src/virtual-machine.js#L668
  function  modifiedAddCostume (md5ext, costumeObject, optTargetId, optVersion) {
    const target = optTargetId ? this.runtime.getTargetById(optTargetId) :
        this.editingTarget;
    if (target) {
        return vm.loadCostume(md5ext, costumeObject, this.runtime, optVersion).then(() => {
            target.addCostume(costumeObject);
            target.setCostume(
                target.getCostumes().length - 1
            );
            this.runtime.emitProjectChanged();
        });
    }
    // If the target cannot be found by id, return a rejected promise
    // TODO: reject with an Error (possible breaking API change!)
    // eslint-disable-next-line prefer-promise-reject-errors
    return Promise.reject();
  }

  function createAssetConflictDialog(fileName, conflictHandler) {
    // HTML content for the modal
    const modalContent = `
        <div>
          <h2>File Conflict Dialog</h2>
          <p>A file named "${fileName}" already exists. Choose an action:</p>
          <div>
            <div>
                <input type="radio" id="rename" name="conflictAction" value="rename" checked>
                <label for="rename">Rename</label>
            </div>
            <div>
                <input type="radio" id="skip" name="conflictAction" value="skip">
                <label for="skip">Skip/Cancel</label>
            </div>
            <div>
                <input type="radio" id="replace" name="conflictAction" value="replace">
                <label for="replace">Replace</label>
            </div>
            <div>
                <input type="checkbox" id="applyToAll" name="applyToAll">
                <label for="applyToAll">Apply to all files</label>
            </div>
            <button id="confirmBtn">Confirm</button>
          </div>
      </div>
    `;

    // Create the modal
    const {remove, content, closeButton} = addon.tab.createModal('Asset File Conflict', {isOpen: true, useEditorClasses: true})
    content.innerHTML = modalContent;
    content.querySelector('#confirmBtn').addEventListener('click', () => {
      // Logic to handle the confirmation action
      const action = content.querySelector('input[name="conflictAction"]:checked').value;
      const applyToAll = content.querySelector('#applyToAll').checked;
      conflictHandler(action, applyToAll);
      remove(); // Then close the modal
    });
    closeButton.addEventListener("click", remove);
  }

  function replaceProperties(obj1, obj2) {
    //replaces the properties of obj1 with obj 2
    Object.keys(obj1).forEach(key => delete obj1[key]);
    Object.assign(obj1, obj2);
  }

  function wrapAddAssetWithFileConflictModal(originalFn, type){
    return function(...args){
      
      //get args
      const optTargetId  = (type == "costume" ? args[2] : args[1]);
      const assetObj = type == "costume" ? args[1] : args[0];

      // get target and target.sprite
      const target = optTargetId ? this.runtime.getTargetById(optTargetId) : this.editingTarget;
      if (!target) return originalFn.call(this, ...args);
      const sprite = target.sprite;

      // check if the new asset will be renamed by adding a dummy asset and testing if it gets renamed
      const originalName = assetObj.name;
      type === "costume" ? target.addCostume(assetObj) : target.addSound(assetObj);
      const newName = assetObj.name;

      // remove the dummy asset we previously added
      if(type ==='costume'){
        sprite.costumes_ = sprite.costumes_.filter(e => e.name !== newName)
      }else{
        sprite.sounds_ = sprite.sounds_.filter(e => e.name !== newName)
      }

      // if the name is the same, there are no duplicates so we let the originalFn proceed as normal
      if(newName === originalName) return originalFn.call(this, ...args);

      // if there's a conflict, we need to wait for the user to make a choice in the modal dialog before we can act on this
      // Note: as the outer function is not async we can't use await
      // instead we'll create a callback that will handle the conflict once the modal is submitted and push to the conflictQueue
      const conflictHandler = (action)=>{
        switch(action){
          case 'replace':{
            const siblings = (type === 'costume' ? sprite.costumes_ : sprite.sounds)
            const duplicate = siblings.find(e => e.name===originalName);
            replaceProperties(duplicate, assetObj );
            duplicate.name=originalName;
            type === "costumes" ? this.runtime.emitProjectChanged() : this.emitTargetsUpdate();
            break;
          }
          case 'rename':
            originalFn.call(this, ...args);
            break;
        }
        // 'skip'  is handled by doing nothing
      }
      conflictQueue.push({assetName: originalName, conflictHandler: conflictHandler});

      // to avoid polluting any other functions we begin the dequeuing function from within the wrapper function
      // this function sets off a recursive-callback chain which only ends once the queue is empty, so to avoid duplicate chains we only call it if the chain hasn't started
      if(!conflictChainStarted){
        conflictChainStarted = true;
        dequeueConflictModal();
      }    
    }
  }

  function dequeueConflictModal() {
    // handle base case
    if(conflictQueue.length === 0){
      applyToAll = false;
      conflictChainStarted = false;
      return;
    } 

    // dequeue conflict from the conflictQueue
    const {assetName, conflictHandler} = conflictQueue.shift()

    // handle the case that applyToAll is set
    if(applyToAll){
      conflictHandler(action);
      dequeueConflictModal();
      return;
    }

    createAssetConflictDialog(assetName, (action_, applyToAll_)=>{
      // apply the chosen conflict resolution action
      conflictHandler(action_)

      // set applyToAll and it's corresponding action
      if(applyToAll_){
        applyToAll = true;
        action = action_
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

  // pollute the costume and sound adding code to handle the replace/skip actions for assets
  const originalAddCostume = vm.addCostume;
  const originalAddSound = vm.addSound;
  vm.addCostume = wrapAddAssetWithFileConflictModal(originalAddCostume, "costume")
  vm.addSound = wrapAddAssetWithFileConflictModal(originalAddSound, "sound")
}