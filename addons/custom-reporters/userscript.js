import { VarTranspiler } from "./transpilers/var.js";
import { ListTranspiler } from "./transpilers/list.js";

export default async function ({ addon, msg, console }) {
  const vm = addon.tab.traps.vm;

  const ScratchBlocks = await addon.tab.traps.getBlockly();

  ScratchBlocks.Blocks["procedures_prototype_reporter"] = {
    /**
     * Block for calling a procedure with a return value, for rendering inside
     * define block.
     * @this {ProcedurePrototypeBlock}
     */
    init: function () {
      const originalJsonInit = ScratchBlocks.BlockSvg.prototype.jsonInit;
      ScratchBlocks.BlockSvg.prototype.jsonInit = function (json) {
        originalJsonInit.call(
          this,
          Object.assign(json, {
            extensions: ["colours_more", "output_number", "output_string"],
          })
        );
      };
      ScratchBlocks.Blocks["procedures_prototype"].init.call(this);
      ScratchBlocks.BlockSvg.prototype.jsonInit = originalJsonInit;
    },
  };

  ScratchBlocks.Blocks["procedures_prototype_boolean"] = {
    /**
     * Block for calling a procedure with a boolean return value, for rendering inside
     * define block.
     * @this {ProcedurePrototypeBlock}
     */
    init: function () {
      const originalJsonInit = ScratchBlocks.BlockSvg.prototype.jsonInit;
      ScratchBlocks.BlockSvg.prototype.jsonInit = function (json) {
        originalJsonInit.call(
          this,
          Object.assign(json, {
            extensions: ["colours_more", "output_boolean"],
          })
        );
      };
      ScratchBlocks.Blocks["procedures_prototype"].init.call(this);
      ScratchBlocks.BlockSvg.prototype.jsonInit = originalJsonInit;
    },
  };

  ScratchBlocks.Blocks["procedures_call_reporter"] = {
    /**
     * Block for calling a procedure with no return value.
     * @this {ProcedureCallBlock}
     */
    init: function () {
      const originalJsonInit = ScratchBlocks.BlockSvg.prototype.jsonInit;
      ScratchBlocks.BlockSvg.prototype.jsonInit = function (json) {
        originalJsonInit.call(
          this,
          Object.assign(json, {
            extensions: ["colours_more", "output_string", "output_number", "procedure_call_contextmenu"],
          })
        );
      };
      ScratchBlocks.Blocks["procedures_call"].init.call(this);
      ScratchBlocks.BlockSvg.prototype.jsonInit = originalJsonInit;
    },
  };

  ScratchBlocks.Blocks["procedures_call_boolean"] = {
    /**
     * Block for calling a procedure with no return value.
     * @this {ProcedureCallBlock}
     */
    init: function () {
      const originalJsonInit = ScratchBlocks.BlockSvg.prototype.jsonInit;
      ScratchBlocks.BlockSvg.prototype.jsonInit = function (json) {
        originalJsonInit.call(
          this,
          Object.assign(json, {
            extensions: ["colours_more", "output_boolean", "procedure_call_contextmenu"],
          })
        );
      };
      ScratchBlocks.Blocks["procedures_call"].init.call(this);
      ScratchBlocks.BlockSvg.prototype.jsonInit = originalJsonInit;
    },
  };

  ScratchBlocks.Blocks["procedures_definition_reporter"] = {
    /**
     * Block for defining a procedure with a return value.
     * @this ScratchBlocks.Block
     */
    init: function () {
      this.jsonInit({
        message0: ScratchBlocks.Msg.PROCEDURES_DEFINITION,
        args0: [
          {
            type: "input_value",
            name: "custom_block",
          },
        ],
        extensions: ["colours_more", "shape_hat", "procedure_def_contextmenu"],
      });
    },
  };

  ScratchBlocks.Blocks["procedures_return_reporter"] = {
    init: function () {
      this.jsonInit({
        id: "procedures_return_reporter",
        message0: msg("return"),
        args0: [
          {
            type: "input_value",
            name: "return_value",
          },
        ],
        extensions: ["colours_more", "shape_end"],
      });
    },
  };

  ScratchBlocks.Blocks["procedures_return_boolean"] = {
    init: function () {
      this.jsonInit({
        id: "procedures_return_boolean",
        message0: msg("return"),
        args0: [
          {
            type: "input_value",
            name: "return_value",
            check: "Boolean",
          },
        ],
        extensions: ["colours_more", "shape_end"],
      });
    },
  };

  console.log(ScratchBlocks);

  // const oldDraw = ScratchBlocks.zelos.Drawer.prototype.draw;
  // ScratchBlocks.zelos.Drawer.prototype.draw = function () {
  //   this.info_.constructor.prototype.isBowlerHatBlock = function () {
  //     if (this.block_.type === "procedures_definition_reporter") {
  //       this.block_.hat = "bowler";
  //     }
  //     return this.block_.hat === "bowler" || this.block_.type === "procedures_definition_reporter";
  //   };
  //   return oldDraw.call(this);
  // };

  // const oldRenderDrawRight = ScratchBlocks.BlockSvg.prototype.renderDrawRight_;
  // ScratchBlocks.BlockSvg.prototype.renderDrawRight_ = function (steps, inputRows, iconWidth) {
  //   if (this.type === "procedures_definition_reporter") {
  //     this.type = "procedures_definition";
  //     const returnVal = oldRenderDrawRight.call(this, steps, inputRows, iconWidth);
  //     this.type = "procedures_definition_reporter";
  //     return returnVal;
  //   }
  //   return oldRenderDrawRight.call(this, steps, inputRows, iconWidth);
  // };

  // const oldRenderCompute = ScratchBlocks.BlockSvg.prototype.renderCompute_;
  // ScratchBlocks.BlockSvg.prototype.renderCompute_ = function (iconWidth) {
  //   if (this.type === "procedures_definition_reporter") {
  //     this.type = "procedures_definition";
  //     const returnVal = oldRenderCompute.call(this, iconWidth);
  //     this.type = "procedures_definition_reporter";
  //     return returnVal;
  //   }
  //   return oldRenderCompute.call(this, iconWidth);
  // };

  // const oldRenderDrawLeft = ScratchBlocks.BlockSvg.prototype.renderDrawLeft_;
  // ScratchBlocks.BlockSvg.prototype.renderDrawLeft_ = function (steps) {
  //   oldRenderDrawLeft.call(this, steps);
  //   if (this.type === "procedures_definition_reporter") {
  //     const vIndex = steps.indexOf("v"); // presumably this might not always be in the same position (eg when cat blocks)
  //     if (vIndex === -1) return;
  //     steps[vIndex + 1] = 68; // todo: compat w/ custom-block-shape
  //   }
  // };

  // todo: patch allProcedureMutations

  ScratchBlocks.Procedures.getCallers = function (name, workspace, definitionRoot, allowRecursive) {
    return workspace.getTopBlocks().flatMap((block) => {
      if (block.id === definitionRoot.id && !allowRecursive) {
        return [];
      }

      return block.getDescendants(false).filter((descendant) => {
        return (
          ScratchBlocks.Procedures.isProcedureBlock(descendant) &&
          (descendant.type === "procedures_call" ||
            descendant.type === "procedures_call_reporter" ||
            descendant.type === "procedures_call_boolean") &&
          descendant.getProcCode() === name
        );
      });
    });
  };

  // TODO: check: does this actually patch the function we want to? It doesn't seem to be exported
  // but it is present in the module. :thinking:
  ScratchBlocks.Procedures.getDefineBlock = function (procCode, workspace) {
    // Assume that a procedure definition is a top block.
    return workspace.getTopBlocks(false).find((block) => {
      if (block.type === "procedures_definition" || block.type === "procedures_definition_reporter") {
        const prototypeBlock = block.getInput("custom_block").connection.targetBlock();
        return ScratchBlocks.Procedures.isProcedureBlock(prototypeBlock) && prototypeBlock.getProcCode() === procCode;
      }

      return false;
    });
  };

  function mutateCallersAndPrototype(name, workspace, mutation) {
    const defineBlock = ScratchBlocks.Procedures.getDefineBlock(name, workspace);
    const prototypeBlock = ScratchBlocks.Procedures.getPrototypeBlock(name, workspace);
    if (!(defineBlock && prototypeBlock)) {
      alert("No define block on workspace"); // TODO decide what to do about this.
      return;
    }

    const callers = ScratchBlocks.Procedures.getCallers(name, defineBlock.workspace, defineBlock, true /* allowRecursive */);
    callers.push(prototypeBlock);
    ScratchBlocks.Events.setGroup(true);
    callers.forEach((caller) => {
      const oldMutationDom = caller.mutationToDom();
      const oldMutation = oldMutationDom && ScratchBlocks.Xml.domToText(oldMutationDom);
      caller.domToMutation(mutation);
      const newMutationDom = caller.mutationToDom();
      const newMutation = newMutationDom && ScratchBlocks.Xml.domToText(newMutationDom);
      if (oldMutation !== newMutation) {
        ScratchBlocks.Events.fire(
          new (ScratchBlocks.Events.get(ScratchBlocks.Events.BLOCK_CHANGE))(
            caller,
            "mutation",
            null,
            oldMutation,
            newMutation
          )
        );
      }
    });
    ScratchBlocks.Events.setGroup(false);
  }

  function editProcedureCallbackFactory(block) {
    return (mutation) => {
      if (mutation && ScratchBlocks.Procedures.isProcedureBlock(block)) {
        mutateCallersAndPrototype(block.getProcCode(), block.workspace, mutation);
      }
    };
  }

  // TODO: actually patch this in the relevant places; the function isn't exported
  ScratchBlocks.Procedures.editProcedureCallback__Sa = function (block) {
    // Edit can come from one of three block types (call, define, prototype)
    // Normalize by setting the block to the prototype block for the procedure.
    let prototypeBlock;
    if (block.type === "procedures_definition" || block.type === "procedures_definition") {
      const input = block.getInput("custom_block");
      if (!input) {
        alert("Bad input"); // TODO: Decide what to do about this.
        return;
      }
      const conn = input.connection;
      if (!conn) {
        alert("Bad connection"); // TODO: Decide what to do about this.
        return;
      }
      const innerBlock = conn.targetBlock();
      if (
        !innerBlock ||
        (innerBlock.type !== "procedures_prototype" &&
          innerBlock.type !== "procedures_prototype_reporter" &&
          innerBlock.type !== "procedures_prototype_boolean")
      ) {
        alert("Bad inner block"); // TODO: Decide what to do about this.
        return;
      }
      prototypeBlock = innerBlock;
    } else if (
      (block.type === "procedures_call" ||
        block.type === "procedures_call_reporter" ||
        block.type === "procedures_call_boolean") &&
      ScratchBlocks.Procedures.isProcedureBlock(block)
    ) {
      // This is a call block, find the prototype corresponding to the procCode.
      // Make sure to search the correct workspace, call block can be in flyout.
      const workspaceToSearch = block.workspace.isFlyout ? block.workspace.targetWorkspace : block.workspace;
      prototypeBlock = ScratchBlocks.Procedures.getPrototypeBlock(block.getProcCode(), workspaceToSearch);
    } else {
      prototypeBlock = block;
    }
    // Block now refers to the procedure prototype block, it is safe to proceed.
    ScratchBlocks.ScratchProcedures.externalProcedureDefCallback(
      prototypeBlock.mutationToDom(),
      editProcedureCallbackFactory(prototypeBlock)
    );
  };

  ScratchBlocks.Procedures.isProcedureBlock = function (block) {
    return (
      block.type === "procedures_call" ||
      block.type === "procedures_call_reporter" ||
      block.type === "procedures_call_boolean" ||
      block.type === "procedures_declaration" ||
      block.type === "procedures_prototype" ||
      block.type === "procedures_prototype_reporter" ||
      block.type === "procedures_prototype_boolean"
    );
  };

  ScratchBlocks.Procedures.getPrototypeBlock = function (procCode, workspace) {
    const defineBlock = ScratchBlocks.Procedures.getDefineBlock(procCode, workspace);
    if (defineBlock) {
      return defineBlock.getInput("custom_block").connection.targetBlock();
    }
    return undefined;
  };

  addon.tab.redux.initialize();
  //vm.emitWorkspaceUpdate();
  const UPDATE_TOOLBOX_ACTION = "scratch-gui/toolbox/UPDATE_TOOLBOX";

  const xmlParser = new DOMParser();
  const xmlSerializer = new XMLSerializer();

  function encodeXML(string) {
    return string
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  // source: https://github.com/scratchfoundation/scratch-blocks/blob/e6ecb8e813009ccdb83068969163abcb6df85865/src/procedures.ts#L235C1-L247C2
  function newProcedureMutation() {
    const mutationText = `
    <xml>
      <mutation
        proccode="${ScratchBlocks.Msg["PROCEDURE_DEFAULT_NAME"]}"
        argumentids="[]"
        argumentnames="[]"
        argumentdefaults="[]"
        warp="false">
      </mutation>
    </xml>`;
    return ScratchBlocks.utils.xml.textToDom(mutationText).firstElementChild;
  }

  function createProcedureCallbackFactory(workspace) {
    return (mutation) => {
      if (!mutation) return;

      const blockText = `
      <xml>
        <block type="procedures_definition">
          <statement name="custom_block">
            <shadow type="procedures_prototype">
              ${ScratchBlocks.Xml.domToText(mutation)}
            </shadow>
          </statement>
        </block>
      </xml>`;
      const blockDom = ScratchBlocks.utils.xml.textToDom(blockText).firstElementChild;
      ScratchBlocks.Events.setGroup(true);
      const block = ScratchBlocks.Xml.domToBlock(blockDom, workspace);
      ScratchBlocks.renderManagement.finishQueuedRenders().then(() => {
        // To convert from pixel units to workspace units
        const scale = workspace.scale;
        // Position the block so that it is at the top left of the visible
        // workspace, padded from the edge by 30 units. Position in the top right
        // if RTL.
        let posX = -workspace.scrollX;
        if (workspace.RTL) {
          posX += workspace.getMetrics().contentWidth - 30;
        } else {
          posX += 30;
        }
        block.moveBy(posX / scale, (-workspace.scrollY + 30) / scale);
        block.scheduleSnapAndBump();
        ScratchBlocks.Events.setGroup(false);
      });
    };
  }

  const reduxStateListener = async (e) => {
    if (e.detail.action.type === UPDATE_TOOLBOX_ACTION && !e.detail.action.saExtraBlocks) {
      const toolboxXML = xmlParser.parseFromString(e.detail.action.toolboxXML, "text/xml");
      const blocks = vm.editingTarget.blocks;
      const myBlocksCat = toolboxXML.querySelector(`category[toolboxitemid="myBlocks"`);
      console.log(toolboxXML, myBlocksCat);
      myBlocksCat.removeAttribute("custom");
      myBlocksCat.innerHTML = "";
      const myBlocks = [];
      for (const blockid of blocks._scripts.filter(
        (bid) =>
          blocks._blocks[bid].opcode === "procedures_definition_reporter" ||
          blocks._blocks[bid].opcode === "procedures_definition"
      )) {
        const blockEl = toolboxXML.createElement("block");
        const definitionBlock = blocks._getCustomBlockInternal(blocks._blocks[blockid]);
        blockEl.setAttribute("type", "procedures_call" + definitionBlock.opcode.substr("procedures_prototype".length));
        const mutation = definitionBlock.mutation;
        const mutationXML = blocks.mutationToXML(mutation);
        blockEl.innerHTML = mutationXML;
        const argids = JSON.parse(mutation.argumentids);
        const argdefaults = JSON.parse(mutation.argumentdefaults);
        for (let i = 0; i < argids.length; i++) {
          if (argdefaults[i] === "") {
            // is there a better way to determine if this argument is a string/number?
            blockEl.innerHTML += `<value name="${encodeXML(argids[i])}">
              <shadow type="text">
                <field name="TEXT"></field>
              </shadow>
            </value>`;
          }
        }
        myBlocks.push(blockEl);
      }
      myBlocks.sort((a, b) => {
        const procA = a.firstChild.getAttribute("proccode");
        const procB = b.firstChild.getAttribute("proccode");
        if (procA > procB) return 1;
        if (procA < procB) return -1;
        return 0; // this should never happen
      });
      for (const block of myBlocks) {
        myBlocksCat.appendChild(block);
      }
      myBlocksCat.innerHTML += `<block type="procedures_return_reporter" id="procedures_return_reporter">
        <value name="return_value">
          <shadow type="text">
            <field name="TEXT"></field>
          </shadow>
        </value>
      </block>`;
      const newBlockButton = toolboxXML.createElement("button");
      newBlockButton.setAttribute("text", ScratchBlocks.Msg.NEW_PROCEDURE);
      newBlockButton.setAttribute("callbackKey", "CREATE_PROCEDURE");
      addon.tab.traps.getWorkspace().registerButtonCallback("CREATE_PROCEDURE", () => {
        ScratchBlocks.ScratchProcedures.externalProcedureDefCallback(
          newProcedureMutation(),
          createProcedureCallbackFactory(addon.tab.traps.getWorkspace())
        );
      });
      myBlocksCat.appendChild(newBlockButton);
      addon.tab.redux.dispatch({
        type: UPDATE_TOOLBOX_ACTION,
        toolboxXML: xmlSerializer.serializeToString(toolboxXML),
        saExtraBlocks: true,
      });
    }
  };

  const updateToolbox = () => {
    if (vm.editingTarget) {
      addon.tab.redux.dispatch({
        type: UPDATE_TOOLBOX_ACTION,
        toolboxXML: addon.tab.redux.state.scratchGui.toolbox.toolboxXML,
      });
    }
  };

  const onEnabled = () => {
    addon.tab.redux.addEventListener("statechanged", reduxStateListener);
    updateToolbox();
  };

  onEnabled();

  await new Promise((resolve) => {
    if (addon.tab.traps.vm.editingTarget) return resolve();
    addon.tab.traps.vm.runtime.once("PROJECT_LOADED", resolve);
  });

  const blocksPrototype = vm.editingTarget.blocks.constructor.prototype;
  blocksPrototype.toolboxUpdateQueued = false;
  blocksPrototype.queueToolboxUpdate = function () {
    this.toolboxUpdateQueued = true;
  };
  const oldCreateBlock = blocksPrototype.createBlock;
  blocksPrototype.createBlock = function (block) {
    oldCreateBlock.call(this, block);
    if (block.opcode === "procedures_definition" || block.opcode === "procedures_definition_reporter") {
      this.queueToolboxUpdate();
    }
  };
  const oldChangeBlock = blocksPrototype.changeBlock;
  blocksPrototype.changeBlock = function (args) {
    oldChangeBlock.call(this, args);
    if (
      args.element === "mutation" &&
      ["procedures_prototype", "procedures_prototype_reporter", "procedures_prototype_boolean"].includes(
        this._blocks[args.id].opcode
      )
    ) {
      this.queueToolboxUpdate();
    }
  };
  const oldDeleteBlock = blocksPrototype.deleteBlock;
  blocksPrototype.deleteBlock = function (blockid) {
    if (!this._blocks[blockid]) return;
    const opcode = this._blocks[blockid].opcode;
    oldDeleteBlock.call(this, blockid);
    if (opcode === "procedures_definition" || opcode === "procedures_definition_reporter") {
      this.queueToolboxUpdate();
    }
  };
  const oldBlocklyListen = blocksPrototype.blocklyListen;
  blocksPrototype.blocklyListen = function (e) {
    oldBlocklyListen.call(this, e);
    if (this.toolboxUpdateQueued) {
      Promise.resolve().then(() => {
        console.log("updatetoolbox");
        updateToolbox();
      });
      this.toolboxUpdateQueued = false;
    }
  };

  let Transpiler;
  switch (addon.settings.get("transpilerMode")) {
    case "var":
      Transpiler = VarTranspiler;
      break;
    case "list_no_gc":
      Transpiler = ListTranspiler;
      break;
    default:
      throw "unknown value of transpilerMode setting";
  }

  new Transpiler(vm, ScratchBlocks);

  let hasSetUpInputButtons = false;

  while (true) {
    const modal = (
      await addon.tab.waitForElement("div[class*=custom-procedures_modal-content_]", { markAsSeen: true })
    ).querySelector("div");
    const header = modal.querySelector("div[class*=modal_header]");
    const selectTypeDiv = Object.assign(document.createElement("div"), {
      className: addon.tab.scratchClass("custom-procedures_options-row", "custom-procedures4body box_box"),
      innerHTML: `
            <div id="sa-custom-reporter_select-block-type_stack" class="${addon.tab.scratchClass(
              "custom-procedures_option-card"
            )}" role="button" tabindex="0">
                <img class="${addon.tab.scratchClass("custom-procedures_option-icon")}" src="${
                  addon.self.dir
                }/stack.svg">
                <div class="${addon.tab.scratchClass("custom-procedures_option-title")}">
                    <span>${msg("stack")}</span>
                </div>
            </div>
            <div id="sa-custom-reporter_select-block-type_number" class="${addon.tab.scratchClass(
              "custom-procedures_option-card"
            )}" role="button" tabindex="0">
                <img class="${addon.tab.scratchClass("custom-procedures_option-icon")}" src="${
                  addon.self.dir
                }/reporter.svg">
                <div class="${addon.tab.scratchClass("custom-procedures_option-title")}">
                    <span>${msg("numortext")}</span>
                </div>
            </div>
            <div id="sa-custom-reporter_select-block-type_predicate" class="${addon.tab.scratchClass(
              "custom-procedures_option-card"
            )}" role="button" tabindex="0">
                <img class="${addon.tab.scratchClass("custom-procedures_option-icon")}" src="${
                  addon.self.dir
                }/predicate.svg">
                <div class="${addon.tab.scratchClass("custom-procedures_option-title")}">
                    <span>${msg("boolean")}</span>
                </div>
            </div>
            `,
    });

    let selectedType = "stack";
    const blockExtensions = {
      stack: ["shape_statement"],
      number: ["output_number", "output_string"],
      predicate: ["output_boolean"],
    };

    // make the custom block editor thing the right shape
    const originalInit = ScratchBlocks.Blocks.procedures_declaration.init;
    ScratchBlocks.Blocks.procedures_declaration.init = function (...args) {
      const originalJsonInit = this.jsonInit;
      this.jsonInit = function (obj) {
        return originalJsonInit.call(
          this,
          Object.assign(obj, {
            extensions: ["colours_more", ...blockExtensions[selectedType]],
          })
        );
      };
      originalInit.call(this, ...args);

      // ignore any calls from scratch to add labels/inputs, as it tries to add them to a block that probably won't exist anymore
      // yet it will add an extra inputs after first page load if you don't change the block type?
      const oldAddLabel = this.addLabelExternal;
      this.addLabelExternal = function (isSA) {
        if (isSA) {
          return oldAddLabel.call(this);
        }
      };
      const oldAddBool = this.addBooleanExternal;
      this.addBooleanExternal = function (isSA) {
        if (isSA) {
          return oldAddBool.call(this);
        }
      };
      const oldAddStringNum = this.addStringNumberExternal;
      this.addStringNumberExternal = function (isSA) {
        if (isSA) {
          return oldAddStringNum.call(this);
        }
      };
    };

    const workspace = ScratchBlocks.getMainWorkspace();
    let mutationRoot = workspace.getTopBlocks()[0];
    const mutator = mutationRoot.mutationToDom();
    console.log(addon.tab.redux.state.scratchGui.customProcedures.mutator.outerHTML)
    const originalMutationRoot = mutationRoot;

    mutationRoot.dispose();

    const setupMutationRoot = () => {
      // from https://github.com/LLK/scratch-gui/blob/c5d4aea493b58c15570915753e1c0f9e7e812ec1/src/containers/custom-procedures.jsx
      mutationRoot.setMovable(false);
      mutationRoot.setDeletable(false);
      mutationRoot.contextMenu = false;
      console.log(addon.tab.redux.state.scratchGui.customProcedures.mutator.outerHTML, mutator.outerHTML)
      mutationRoot.domToMutation(addon.tab.redux.state.scratchGui.customProcedures.mutator);
      mutationRoot.initSvg();
      mutationRoot.render();
      // Allow the initial events to run to position this block, then focus.
      setTimeout(() => {
        mutationRoot.focusLastEditor_();
      });
    };

    mutationRoot = workspace.newBlock("procedures_declaration");
    setupMutationRoot();

    originalMutationRoot.mutationToDom = function (arg) {
      return mutationRoot.mutationToDom(arg);
    };

    let rtlOffset = 0;

    // stop scratch from trying to move its potentially deleted block around...
    // at the moment this uses some sort of magic number which isn't ideal. mabe just get rid
    // of all event listeners and rebuild.
    workspace.listeners[3] = () => null;

    workspace.addChangeListener(() => {
      // from https://github.com/LLK/scratch-gui/blob/c5d4aea493b58c15570915753e1c0f9e7e812ec1/src/containers/custom-procedures.jsx
      mutationRoot.onChangeFn();
      // Keep the block centered on the workspace
      const metrics = workspace.getMetrics();
      const { x, y } = mutationRoot.getRelativeToSurfaceXY();
      const dy = metrics.viewHeight / 2 - mutationRoot.height / 2 - y;
      let dx;
      if (addon.tab.direction === "rtl") {
        // // TODO: https://github.com/LLK/scratch-gui/issues/2838
        // This is temporary until we can figure out what's going on width
        // block positioning on the workspace for RTL.
        // Workspace is always origin top-left, with x increasing to the right
        // Calculate initial starting offset and save it, every other move
        // has to take the original offset into account.
        // Calculate a new left postion based on new width
        // Convert current x position into LTR (mirror) x position (uses original offset)
        // Use the difference between ltrX and mirrorX as the amount to move
        const ltrX = metrics.viewWidth / 2 - mutationRoot.width / 2 + 25;
        const mirrorX = x - (x - rtlOffset) * 2;
        if (mirrorX === ltrX) {
          return;
        }
        dx = mirrorX - ltrX;
        const midPoint = metrics.viewWidth / 2;
        if (x === 0) {
          // if it's the first time positioning, it should always move right
          if (mutationRoot.width < midPoint) {
            dx = ltrX;
          } else if (mutationRoot.width < metrics.viewWidth) {
            dx = midPoint - (metrics.viewWidth - mutationRoot.width) / 2;
          } else {
            dx = midPoint + (mutationRoot.width - metrics.viewWidth);
          }
          mutationRoot.moveBy(dx, dy);
          rtlOffset = mutationRoot.getRelativeToSurfaceXY().x;
          return;
        }
        if (mutationRoot.width > metrics.viewWidth) {
          dx = dx + mutationRoot.width - metrics.viewWidth;
        }
      } else {
        dx = metrics.viewWidth / 2 - mutationRoot.width / 2 - x;
        // If the procedure declaration is wider than the view width,
        // keep the right-hand side of the procedure in view.
        if (mutationRoot.width > metrics.viewWidth) {
          dx = metrics.viewWidth - mutationRoot.width - x;
        }
      }
      mutationRoot.moveBy(dx, dy);
    });

    const setUpButtons = () => {
      const inputAddButtons = modal.querySelectorAll("div[class*=custom-procedures_body] > div > div");
      inputAddButtons[0].addEventListener("click", () => mutationRoot.addStringNumberExternal(true));
      inputAddButtons[1].addEventListener("click", () => mutationRoot.addBooleanExternal(true));
      inputAddButtons[2].addEventListener("click", () => mutationRoot.addLabelExternal(true));
    };

    const selectBlockTypeFactory = (type) => {
      return () => {
        // don't set these listeners up until we first change the block type,
        // since before that scratch will add them just fine for some reason
        if (!hasSetUpInputButtons) {
          setUpButtons();
          hasSetUpInputButtons = true;
        }
        // scratch-gui doesn't seem to keep track of the mutator
        // so we do it instead, so inputs aren't lost when changing block type
        // addon.tab.redux.state.scratchGui.customProcedures.mutator = mutationRoot.mutationToDom();
        addon.tab.redux.dispatch({
          type: "scratch-gui/custom-procedures/ACTIVATE_CUSTOM_PROCEDURES",
          mutator: mutationRoot.mutationToDom(),
          callback: addon.tab.redux.state.scratchGui.customProcedures.callback,
        });
        console.log(workspace);
        selectedType = type;
        rtlOffset = 0;
        ScratchBlocks.Xml.domToBlock(ScratchBlocks.Xml.blockToDom(workspace.getTopBlocks()[0]), workspace);
        const oldMutationRoot = mutationRoot;
        mutationRoot = workspace.getTopBlocks().at(-1);
        setupMutationRoot();
        console.log(workspace);
        oldMutationRoot.dispose();
        console.log(workspace);
      };
    };

    header.insertAdjacentElement("afterend", selectTypeDiv);
    for (const blockType of ["stack", "number", "predicate"]) {
      document
        .getElementById(`sa-custom-reporter_select-block-type_${blockType}`)
        .addEventListener("click", selectBlockTypeFactory(blockType));
    }

    if (hasSetUpInputButtons) {
      setUpButtons();
    }

    const oldReduxCb = addon.tab.redux.state.scratchGui.customProcedures.callback;

    /*console.log(oldReduxCb.toString());
    addon.tab.redux.dispatch({
      type: "scratch-gui/custom-procedures/SET_CALLBACK",
      callback: function (t) {
        if (t) {
          (t =
            '<xml><block type="procedures_definition"><statement name="custom_block"><shadow type="procedures_prototype">' +
            ScratchBlocks.Xml.domToText(t) +
            "</shadow></statement></block></xml>"),
            (t = ScratchBlocks.Xml.textToDom(t).firstChild),
            ScratchBlocks.Events.setGroup(!0),
            (t = ScratchBlocks.Xml.domToBlock(t, e));
          var o = e.scale,
            n = -e.scrollX;
          (n = e.RTL ? n + (e.getMetrics().contentWidth - 30) : n + 30),
            t.moveBy(n / o, (30 - e.scrollY) / o),
            t.scheduleSnapAndBump(),
            ScratchBlocks.Events.setGroup(!1);
        }
      },
    });*/

    const oldCreateProcedureCallbackFactory = ScratchBlocks.Procedures.createProcedureCallbackFactory_;
    addon.tab.redux.dispatch({
      type: "scratch-gui/custom-procedures/SET_CALLBACK",
      callback: (mutation) => {
        if (mutation) {
          const wksp = addon.tab.traps.getWorkspace();
          const statementOrValue = {
            stack: "statement",
            number: "value",
            predicate: "value",
          }[selectedType];
          const blockText =
            "<xml>" +
            `<block type="procedures_definition${statementOrValue === "value" ? "_reporter" : ""}">` +
            `<${statementOrValue} name="custom_block">` +
            `<shadow type="procedures_prototype${
              {
                stack: "",
                number: "_reporter",
                predicate: "_boolean",
              }[selectedType]
            }">` +
            ScratchBlocks.Xml.domToText(mutation) +
            "</shadow>" +
            `</${statementOrValue}>` +
            "</block>" +
            "</xml>";
          var blockDom = ScratchBlocks.utils.xml.textToDom(blockText).firstChild;
          ScratchBlocks.Events.setGroup(true);
          console.log(blockDom);
          var block = ScratchBlocks.Xml.domToBlock(blockDom, wksp);
          var scale = wksp.scale; // To convert from pixel units to workspace units
          // Position the block so that it is at the top left of the visible workspace,
          // padded from the edge by 30 units. Position in the top right if RTL.
          var posX = -wksp.scrollX;
          if (workspace.RTL) {
            posX += wksp.getMetrics().contentWidth - 30;
          } else {
            posX += 30;
          }
          block.moveBy(posX / scale, (-wksp.scrollY + 30) / scale);
          block.scheduleSnapAndBump();
          ScratchBlocks.Events.setGroup(false);
        }
      },
    });

    modal.querySelector("div[class*=custom-procedures_checkbox-row] input").addEventListener("change", (e) => {
      mutationRoot.setWarp(e.target.checked);
    });

    /*modal.querySelector("button[class*=custom-procedures_ok-button]").addEventListener("click", () => {
      console.log(mutationRoot.mutationToDom(true));
      oldReduxCb(mutationRoot.mutationToDom(true));
    });*/
  }
}
