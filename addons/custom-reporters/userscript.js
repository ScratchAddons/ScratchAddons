export default async function ({ addon, msg, console }) {
  const ScratchBlocks = await addon.tab.traps.getBlockly();
  addon.tab.redux.initialize();
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
      return originalInit.call(this, ...args);
    };

    // ignore any calls from scratch to add labels/inputs, as it tries to add them to a block that probably won't exist anymore
    // yet it will add an extra inputs after first page load if you don't change the block type?
    const oldAddLabel = ScratchBlocks.Blocks.procedures_declaration.addLabelExternal;
    ScratchBlocks.Blocks.procedures_declaration.addLabelExternal = function (isSA) {
      if (isSA) {
        return oldAddLabel.call(this);
      }
    };
    const oldAddBool = ScratchBlocks.Blocks.procedures_declaration.addBooleanExternal;
    ScratchBlocks.Blocks.procedures_declaration.addBooleanExternal = function (isSA) {
      if (isSA) {
        return oldAddBool.call(this);
      }
    };
    const oldAddStringNum = ScratchBlocks.Blocks.procedures_declaration.addStringNumberExternal;
    ScratchBlocks.Blocks.procedures_declaration.addStringNumberExternal = function (isSA) {
      if (isSA) {
        return oldAddStringNum.call(this);
      }
    };

    const workspace = ScratchBlocks.getMainWorkspace();
    let mutationRoot = workspace.topBlocks_[0];

    let rtlOffset = 0;

    workspace.listeners_[0] = () => null; // stop scratch from trying to move its potentially deleted block around

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

    const setupMutationRoot = () => {
      // from https://github.com/LLK/scratch-gui/blob/c5d4aea493b58c15570915753e1c0f9e7e812ec1/src/containers/custom-procedures.jsx
      mutationRoot.setMovable(false);
      mutationRoot.setDeletable(false);
      mutationRoot.contextMenu = false;
      mutationRoot.domToMutation(addon.tab.redux.state.scratchGui.customProcedures.mutator);
      mutationRoot.initSvg();
      mutationRoot.render();
      // Allow the initial events to run to position this block, then focus.
      setTimeout(() => {
        mutationRoot.focusLastEditor_();
      });
    };

    let hasSetUpInputButtons = false;

    const selectBlockTypeFactory = (type) => {
      return () => {
        // don't set these listeners up until we first change the block type,
        // since before that scratch will add them just fine for some reason
        if (!hasSetUpInputButtons) {
          const inputAddButtons = modal.querySelectorAll("div[class*=custom-procedures_body] > div > div");
          inputAddButtons[0].addEventListener("click", () => mutationRoot.addStringNumberExternal(true));
          inputAddButtons[1].addEventListener("click", () => mutationRoot.addBooleanExternal(true));
          inputAddButtons[2].addEventListener("click", () => mutationRoot.addLabelExternal(true));
          hasSetUpInputButtons = true;
        }
        // scratch-gui doesn't seem to keep track of the mutator
        // so we do it instead, so inputs aren't lost when changing block type
        addon.tab.redux.state.scratchGui.customProcedures.mutator = mutationRoot.mutationToDom();
        selectedType = type;
        rtlOffset = 0;
        ScratchBlocks.duplicate_(workspace.topBlocks_[0]);
        workspace.topBlocks_[0].dispose();
        mutationRoot = workspace.topBlocks_[0];
        setupMutationRoot();
      };
    };

    header.insertAdjacentElement("afterend", selectTypeDiv);
    for (const blockType of ["stack", "number", "predicate"]) {
      document
        .getElementById(`sa-custom-reporter_select-block-type_${blockType}`)
        .addEventListener("click", selectBlockTypeFactory(blockType));
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
    ScratchBlocks.Procedures.createProcedureCallbackFactory_ = function (workspace) {
      return function (mutation) {
        if (mutation) {
          var blockText =
            "<xml>" +
            '<block type="procedures_definition">' +
            '<statement name="custom_block">' +
            '<shadow type="procedures_prototype">' +
            ScratchBlocks.Xml.domToText(mutation) +
            "</shadow>" +
            "</statement>" +
            "</block>" +
            '<block type="looks_say"></block>' +
            "</xml>";
          var blockDom = ScratchBlocks.Xml.textToDom(blockText).firstChild;
          ScratchBlocks.Events.setGroup(true);
          var block = ScratchBlocks.Xml.domToBlock(blockDom, workspace);
          var scale = workspace.scale; // To convert from pixel units to workspace units
          // Position the block so that it is at the top left of the visible workspace,
          // padded from the edge by 30 units. Position in the top right if RTL.
          var posX = -workspace.scrollX;
          if (workspace.RTL) {
            posX += workspace.getMetrics().contentWidth - 30;
          } else {
            posX += 30;
          }
          block.moveBy(posX / scale, (-workspace.scrollY + 30) / scale);
          block.scheduleSnapAndBump();
          ScratchBlocks.Events.setGroup(false);
        }
      };
    };

    modal.querySelector("div[class*=custom-procedures_checkbox-row] input").addEventListener("change", (e) => {
      mutationRoot.setWarp(e.target.checked);
    });

    /*modal.querySelector("button[class*=custom-procedures_ok-button]").addEventListener("click", () => {
      console.log(mutationRoot.mutationToDom(true));
      oldReduxCb(mutationRoot.mutationToDom(true));
    });*/
  }
}
