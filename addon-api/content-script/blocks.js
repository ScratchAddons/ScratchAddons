const color = {
  color: "#43cfca",
  secondaryColor: "#3aa8a4",
  tertiaryColor: "#3aa8a4",
};

let vm;
let customBlocks = [];
let toolbox = [];
let inited = false;

export function addBlock(id, args, handler, hide) {
  if (!customBlocks.find((e) => e.id == id)) {
    customBlocks.push({
      id,
      color: color.color,
      secondaryColor: color.secondaryColor,
      tertiaryColor: color.tertiaryColor,
      args,
      handler,
      hide: !!hide,
    });
    Blockly.getMainWorkspace().getToolbox().refreshSelection();
    vm.emitWorkspaceUpdate();
  }
}

export function removeBlock(id) {
  customBlocks = customBlocks.filter((e) => e.id != id);
}

let injected;

function xesc(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

const injectWorkspace = () => {
  if (injected) {
    return;
  }
  injected = true;

  const workspace = Blockly.getMainWorkspace();
  if (!workspace) throw new Error("expected workspace");

  let BlockSvg = Object.values(Blockly.getMainWorkspace().getFlyout().checkboxes_)[0].block.constructor;
  let oldUpdateColor = BlockSvg.prototype.updateColour;
  BlockSvg.prototype.updateColour = function (...a) {
    if (this.procCode_) {
      let p = this.procCode_;
      let block = customBlocks.find((e) => e.id == p.trim());
      if (block) {
        this.colour_ = block.color;
        this.colourSecondary_ = block.secondaryColor;
        this.colourTertiary_ = block.tertiaryColor;
        let updateChildColors = function updateChildColors() {
          this.childBlocks_.forEach(
            ((e) => {
              e.setColour(e.getColour(), e.getColourSecondary(), this.getColourTertiary());
            }).bind(this)
          );
        }.bind(this);
        updateChildColors();
        const oldPush = this.childBlocks_.constructor.prototype.push.bind(this.childBlocks_);
        this.childBlocks_.push = function (...a) {
          updateChildColors();
          return oldPush(...a);
        };
      }
    }
    return oldUpdateColor.call(this, ...a);
  };

  const flyout = workspace.getFlyout();
  if (!flyout) throw new Error("expected flyout");
  if (!vm) throw new Error("expected vm");
  // Each time a new workspace is made, these callbacks are reset, so re-register whenever a flyout is shown.
  // https://github.com/LLK/scratch-blocks/blob/61f02e4cac0f963abd93013842fe536ef24a0e98/core/flyout_base.js#L469
  const originalShow = flyout.constructor.prototype.show;
  flyout.constructor.prototype.show = function (xml) {
    this.workspace_.registerToolboxCategoryCallback("SABLOCKS", function (e) {
      return [
        ...new DOMParser()
          .parseFromString(
            `<top>` +
              (customBlocks
                .filter((e) => !e.hide)
                .map(
                  (e) =>
                    `<block type="procedures_call" gap="16"><mutation generateshadows="true" proccode="${xesc(
                      e.id
                    )}" argumentids="${xesc(JSON.stringify(e.args.map((e, i) => "arg" + i)))}" argumentnames="${xesc(
                      JSON.stringify(e.args)
                    )}" argumentdefaults="${xesc(
                      JSON.stringify(e.args.map((e) => ""))
                    )}" warp="false"></mutation></block>`
                )
                .join("") ||
                `<label text="${xesc(
                  scratchAddons.l10n.get("noAddedBlocks", null, "No addons have added blocks.")
                )}" showStatusButton="null" />`) +
              `</top>`,
            "text/xml"
          )
          .querySelectorAll("block, label"),
      ];
    });
    return originalShow.call(this, xml);
  };

  // We use Scratch's extension category mechanism to replace the data category with our own.
  // https://github.com/LLK/scratch-gui/blob/ddd2fa06f2afa140a46ec03be91796ded861e65c/src/containers/blocks.jsx#L344
  // https://github.com/LLK/scratch-gui/blob/2ceab00370ad7bd8ecdf5c490e70fd02152b3e2a/src/lib/make-toolbox-xml.js#L763
  // https://github.com/LLK/scratch-vm/blob/a0c11d6d8664a4f2d55632e70630d09ec6e9ae28/src/engine/runtime.js#L1381
  const originalGetBlocksXML = vm.runtime.getBlocksXML;
  vm.runtime.getBlocksXML = function (target) {
    const result = originalGetBlocksXML.call(this, target);
    result.unshift({
      id: "sa-blocks",
      xml: `
          <category
            name="${xesc(scratchAddons.l10n.get("extensionName", null, "Scratch Addons"))}"
            id="sa-blocks"
            colour="#ff7b26"
            secondaryColour="#ff7b26"
            iconURI="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzODYgMzg2Ij4KICA8Y2lyY2xlIGN4PSIxOTMiIGN5PSIxOTMiIHI9IjE5MyIgZmlsbD0iI2ZmN2IyNiIvPgogIDxwYXRoIGZpbGw9IiNmZmYiIGQ9Ik0yNTMuMjc2MTcgMjQzLjQ0OTc5OThjLTEwLjAxNjU2IDI3Ljg1MTk5LTM3LjI0NDA0IDQ0Ljc4MDk3LTgwLjkwNzI0IDUwLjMyMDI3LTEuOTg0NzguMjQ5MzQtMy45MzgzNy40MDQ2LTUuODkyMDcuNDY2OTMtMi41NDI5MSAzLjczNDM1LTUuODYxMDMgNi45NzA4My05Ljc2ODQ0IDkuNDkxNDctMTAuMjMzNSA2LjU2NjIyLTE5LjgxNTk0IDkuNzcxNTItMjkuMjc0MjUgOS43NzE1Mi0xOS40NDM2OSAwLTQwLjM3NjAzNC0xNC41NjM5NC00MC4zNzYwMzQtNDYuNTU0NzQgMC0yLjE3ODM5LjA5MzgzLTUuMDEwMjcuMzEwNi04LjkzMTM4LjA5MzgzLTEuNjgwMzkuMTg2MzY2LTIuOTg3NDguMjE2ODMxLTMuOTUyMTgtLjUyNzQzMS0yLjQyNzM3LS44MDYzNzktNC44ODU4LS44MDYzNzktNy4zNzUzdi0xNS4wNjE5M2MwLTIuNDU4NDQuMjQ4NDgzLTQuOTE2ODcuNzQ0MjYyLTcuMzc1My4wMzUxOS0yLjA4NDk5LjEyNDI5NS00LjQxODk5LjI3ODk0OC02Ljk3MDgxLS43NDQyNjItMi43Mzg0OC0xLjMwMjUwOC01LjkxMjYyLTEuMzAyNTA4LTkuNDYwMzEgMC0xLjYxODE3LjEyNDI5NS0zLjIzNjQ1LjM0MTA2NS00LjgyMzQ3IDEuMTc4Mzk1LTguMzQwMTEgNC44Njg2MzEtMTYuNzExMjcgMTEuMTAxOTAyLTIzLjQwMTkzLTIuMTM5ODM5LTYuMDA2MTItMy4yNTYyMjQtMTIuMzU0NS0zLjI1NjIyNC0xOC44NTgzOHYtMTUuODcxMDJjMC02LjQ0MTc4IDEuMjcxNDQ5LTE0LjQ3MDU1IDcuNTA0NzA3LTM0LjQ0OTM2IDIuNjA0OTEtOC41ODg5OSAzLjQ0MjEyLTExLjI2NTI1IDQuNTg5NTYtMTMuNzU0ODUgNi4xMDkxNS0xMy43NTQ3NDEgMTUuMzE5MzQtMjAuNjMyMTczIDIyLjAxNzY2LTI0LjAyNDI1MiAxMC45NDY4NC01LjQ3NzA2OSAyMi42OTk5Mi04LjI3Nzc2MyAzNC45MTgyMS04LjI3Nzc2MyA1LjY0Mzk1IDAgMTEuMDM5ODkuNTkxNjE1IDE2LjE4NzU5IDEuNzExNTYyIDIuMjk0OS0xLjU1NTk1NSA0Ljc0NDc1LTIuODYzMDQ0IDcuMzQ5NjUtMy45NTIxNzUgMy4zMTgxLTEuNDMxNTE1IDYuODUzMzktMi40MjczODggMTAuNzYwNy0zLjA0OTY5NyA5Ljc2ODQ1LTEuNjgwNTE3IDIwLjA5NTAxLjQwNDYxMSAyOS4wODgxMyA1Ljg4MTU1OCA5LjQ1ODMgNS43ODgzIDIwLjMxMjA3IDE3LjgwMDQxOCAxOC45Nzg2MyA0Mi41MDkzMTctLjIxNjgzIDQuMzU2NzctLjU4OTU1IDEwLjE3NjEyLTEuMTQ3NDYgMTcuNzY5MjQtLjAzNTIuMTg3MDItLjAzNTIuMzcyODUtLjA1ODYuNTU5ODYtLjQ5NTc4IDUuNTA4MjQtMS4yMDk0NiAxMy43MjM4MS0yLjE3MDc4IDI0LjU4NDQ2LjI0ODQ3IDQuMjAxMTYuMTU0NzEgOC45MDAxOS0uMjE2ODMgMTQuNDM5NDktLjE1NDcxIDIuMTE2MTctLjQ5NTc4IDQuMjMyMjItMS4wNTQ4NiA2LjI4NjE3LS4xMjQzLjQ2Njk0LS4yNDg0Ny45MDIxMy0uMzcyNzIgMS4zMDY5NyA0LjE4NjQ5IDUuMzgzNjkgNy4wMzk1NCAxMC43NjczNyA4Ljk5MzI1IDE1LjQzNTM2IDEuODI5NTkgMy43MDMxNyAzLjM4MDExIDcuOTY2NTYgNC43NDQ2MyAxMy4xNjM0OC41Mjc0MyAxLjk2MDU2Ljg2ODUgMy45NTIxNyAxLjAyMzIgNS45NzQ5NSAxLjM5NTQ1IDE3LjQ1ODE0LjY4MjEzIDI3Ljc1ODctMi41NDI5MSAzNi40NzIxM3oiIHN0eWxlPSJtaXgtYmxlbmQtbW9kZTpub3JtYWwiLz4KICA8cGF0aCBmaWxsPSIjZmY3YjI2IiBkPSJNMjIxLjkwOTYxIDIxMC4zOTUwMjk4Yy45MDgzNCAxMS4zMTgxOS43MjE5OSAxOC42MTI1Ni0uNTQ2MTggMjEuODk4NzctNS4yNzgxNSAxNC45NjUzOC0yMy4wMTAwNSAyNC4zNjA0LTUzLjE4OTg0IDI4LjE5NDI1LTEwLjE4Njk4IDEuMjc5MDktMjAuMzY3ODYtMy41NTY5OC0zMC41NTQ5Ni0xNC41MDc4MyAwIDEuNjQzMS4zNjMzNCA2LjU2OTI2IDEuMDk0NyAxNC43ODQ4Mi41NDYxOSA2LjAyMTY0LjQ1MjQyIDEwLjk0NzkyLS4yNzMwOCAxNC43Nzg3MS00LjU0OTM2IDIuOTE5MDItOC4xODM4MiA0LjM4MTYtMTAuOTEyNzMgNC4zODE2LTQuMTg2NDkgMC02LjI3MzQ1LTQuMTA0NjEtNi4yNzM0NS0xMi4zMjAxNyAwLTEuNDU5NS4wOTM3LTMuNzg0MjIuMjczMDgtNi45NzcwNS4xODA1LTMuMTg5NzcuMjczMS01LjQyNzIxLjI3MzEtNi43MDYyOSAwLTMuMTAyNjItLjI3MzEtNS4yOTAzLS44MTkyOC02LjU2OTI4di0xNS4wNTU3YzAtLjM2NDYxLjA5MzgtLjc3NTA5LjI3MzEtMS4yMzIyNi4xNzkzMS0uNDU0LjM2MjE2LS44NjU2Ni41NDYxOC0xLjIzMjM5LS4xODI4NS0yLjU1MTgzLS4wOTM4LTYuNDc1OS4yNzMwOC0xMS43NjkzNy4zNjIxNi0zLjI4NjIzLjM2MjE2LTUuMzgwNjMgMC02LjI5NTQ1LS45MTE4Ni0xLjgyMDQ4LTEuMzYxNDctMi45MTU5Ny0xLjM2MTQ3LTMuMjgzMTcuNzIzMTYtNS4xMDk3NSA0LjQ1NjMxLTcuNjY0NzYgMTEuMTgyNTQtNy42NjQ3NiA0LjM2MzIzIDAgNi45OTkxOSAxLjU1MjkgNy45MTA4MyA0LjY1MjM1IDAgMi45MTkwMi4zNjMzNSA3LjIxMDQgMS4wOTExOSAxMi44NjQ4NCAxLjA5NDcxIDYuNTY5NCA0LjU0NjE5IDEzLjE0MTgzIDEwLjM2NjkgMTkuNzA4MDUgNi4zNjMzNSA3LjQ4NDIxIDEyLjQ1Mzk3IDEwLjk1MDk4IDE4LjI3NzczIDEwLjQwMzIzIDYuNTQ2NDMtLjcyNDUxIDEzLjA5Mjc1LTIuMjc3ODggMTkuNjM5MTgtNC42NTIzMyA5LjA5MjM5LTMuMjg2MjMgMTQuNTQ3MTctNy4xMTcwMiAxNi4zNjc1LTExLjQ5NTU2IDEuMjY4My0zLjI4NjIyIDEuOTA3MTgtNi43NDk4MSAxLjkwNzE4LTEwLjQwMzIzIDAtMTEuMTI4MzUtNC4wOTAzNy0xOS40MzQyNC0xMi4yNzQwNi0yNC45MDgxNC0zLjY0MDY2LTIuMzcxMjgtMTAuMzY2ODktNC4yODgzMi0yMC4xODgwOC01Ljc1MDg4LTUuNjM3NzQtLjcyNDUzLTkuMDk1NDQtMS4wOTUwMi0xMC4zNjM3Mi0xLjA5NTAyLTguNzI5NjUuMTgzNDctMTYuODY5OTctMi42NDUyMS0yNC40MTQ4OC04LjQ4NjMyLTcuNTQ3OTctNS44MzgwNC0xMS4zMTg5Ni0xMi41OTQwOS0xMS4zMTg5Ni0yMC4yNTg4NHYtMTUuODc0MDdjMC0zLjQ2MzYgMi4wMDAyMy0xMS41ODU3NiA2LjAwMzc2LTI0LjM2MDQgMS44MTQxMy02LjAyNDcxIDIuODE1NzctOS4yMTQ0OCAzLjAwMTc3LTkuNTgxNjcgMS42MzQzMy0zLjgzMDggMy43MjQ0Ni02LjM4NTY4IDYuMjcwNDItNy42NjQ3NyA2LjE4MDUzLTMuMDk5NDU1IDEyLjcyNjg1LTQuNjUyMzUzIDE5LjYzOTItNC42NTIzNTMgMTMuNDU1NTEgMCAyMy4zNjY1OSA1LjQ3MzkxMyAyOS43MzMxMSAxNi40MjE4MzMuNTQ2MTguNTQ4MDkgMS40NTQ0MiAxLjM2OTE4IDIuNzI5MDQgMi40NjQ2Ny4xNzkzMS0yLjU1MTgyLjU0NjE4LTYuNDc2IDEuMDkxMTktMTEuNzY5NDgtLjE4Mjg1LTIuMzcxMjctLjM2NTctNC42NTIzNDctLjU0NjE4LTYuODQzMjExIDAtMi41NTE2OTEgMS4yNjg0LTQuMjg1MTQyIDMuODE3NDEtNS4yMDAwNzkuNzI1NDktLjM2MzQ0NiAxLjcyNzM4LS42Mzc0ODcgMy4wMDE4Ny0uODIwOTc1IDEuODE3MjgtLjM2NDYwOSAzLjc3NDA1LjA5NDE2IDUuODY3MjMgMS4zNjYyNDQgMi4wODcxIDEuMjc4OTY0IDIuOTUyMiA1LjExMjkzNSAyLjU4OTQ1IDExLjQ5NTU1MS0uMTgyODUgNC4wMTQ0LS41NDYxOSA5LjY3MTktMS4wOTExOSAxNi45Njk0Ni0uNTQ2MTkgNi4wMjQ2OS0xLjM2MTM1IDE1LjIzOTI5LTIuNDU2MDYgMjcuNjQ5NjYuMzYzMzMgMi45MTkwMi4zNjMzMyA2LjkzNjU5IDAgMTIuMDQzMjktLjkxMTg3IDMuNDY2NzYtMy42NDA2NiA1LjIwMDA5LTguMTgzODEgNS4yMDAwOS0yLjM2NjA1IDAtNC42MzYwOS0uNjM3NDgtNi44MTkxOC0xLjkxMzg2LTEuMDkxMTktMy40NjM1OS0xLjYzNDMyLTQuOTI5MzQtMS42MzQzMi00LjM4MTYuMzU5ODEtNC45MjYyNy0uNjM4NzgtMTEuNDk1NTQtMy4wMDE4OS0xOS43MDgwNS0yLjAwMzI5LTQuMTk0OTItNC43NzI1Mi0xMC4xNjk4OC04LjMyMDI0LTE3LjkyNzktMy41NDc2LTcuNzU0OTgtOC4yMzAyMi0xMS45MDk0NC0xNC4wNDc4Ni0xMi40NTcxOS03LjI3NTExLS41NDgxLTEyLjAwMTIzIDEuOTE2OTMtMTQuMTg0MzEgNy4zOTA5NS0uNzI1NSAyLjM3NDM0LTEuNzMwNDMgNS44NDQxNi0yLjk5ODgzIDEwLjQwMzIzLTIuMTgzMDkgNi43NTI4Ny0zLjU0NzYgMTMuMjMyMDUtNC4wOTM0NCAxOS40MzQxMi0uMTgyODQgMi4wMTAzLS4zNjU2OCAyLjgzMTg2LS41NDYxOCAyLjQ2NDY3LjU0NjE4IDMuNjUzNDIgMS4xODE0NCA3LjMwMDYxIDEuOTEwMjMgMTAuOTUwOTcuOTA4MzQgNC41NjIxNCAzLjEzODMxIDguMDMxOTYgNi42ODI4NyAxMC40MDAxOCAzLjU0NzYgMi4zNzQzNCAxMC4zMTczMiAzLjgzMDc5IDIwLjMyMTMzIDQuMzc4NTMgMjQuNTQ4MTUgMS40NjU2MyAzOS43MzEwNSAxMC4wNDIyOCA0NS41NTE4NiAyNS43MzI2NC45MDYgMS40NjI2OCAxLjgxNDEyIDMuOTI0MTcgMi43MjU4NiA3LjM4Nzg4eiIgc3R5bGU9Im1peC1ibGVuZC1tb2RlOm5vcm1hbCIvPgogIDxwYXRoIGZpbGw9IiNmZjdiMjYiIGQ9Ik0xNjEuNDk5ODkgMjE0LjQ5OTk5OThoMTM4djExM2gtMTM4eiIvPgogIDxwYXRoIGQ9Ik0xOTQuNDk5ODIgMjMyLjQ5OTk5OTh2MTUuMDAwMTJoLTkuOTk5OTN2NzkuOTk5NzdoMTE1LjAwMDIydi03OS45OTk3N2gtOS45OTk5di0xNS4wMDAxMkgyNTcuNTAwMXYxNS4wMDAxMmgtMzEuMDAwMTd2LTE1LjAwMDEyeiIgZmlsbD0iI2ZmZiIvPgo8L3N2Zz4K"
            custom="SABLOCKS">
          </category>`,
    });
    return result;
  };

  // If editingTarget has not been set yet, we have injected before the editor has loaded and emitWorkspaceUpdate will be called later.
  // Otherwise, it's possible that the editor has already loaded and updated its toolbox, so force a workspace update.
  // Workspace updates are slow, so don't do them unless necessary.
  if (vm.editingTarget) {
    vm.emitWorkspaceUpdate();
  }
};
export async function init(tab) {
  if (inited) return;
  inited = true;
  let getEditorMode = () => tab.clientVersion === "scratch-www" && tab.editorMode;
  if (!getEditorMode()) return;
  vm = tab.traps.vm;
  if (!vm) vm = await new Promise((cb) => __scratchAddonsTraps.addEventListener("gotvm", () => cb(tab.traps.vm)));
  async function mainloop() {
    let cache = {};
    while (true) {
      let blockTargets = [vm.runtime.flyoutBlocks, ...vm.runtime.targets.map((e) => e.blocks)];
      blockTargets.forEach((e) => {
        for (let i of [...Object.values(e._blocks)].filter((e) => e.opcode == "procedures_call")) {
          if (cache[i.id]) continue;
          let block = customBlocks.find((e) => i.mutation.proccode.trim() == e.id);
          if (block) {
            const names = block.args;
            const ids = block.args.map((e, i) => "arg" + i);
            const defaults = block.args.map((e) => []);
            cache[i.mutation.proccode] = [names, ids, defaults];
          }
        }
      });
      blockTargets.forEach((e) => {
        Object.assign(e._cache.procedureParamNames, cache);
      });
      await new Promise((cb) => requestAnimationFrame((_) => cb()));
    }
  }
  mainloop();
  const oldStepToProcedure = vm.runtime.sequencer.stepToProcedure;
  vm.runtime.sequencer.stepToProcedure = function (thread, proccode) {
    let blockData = customBlocks.find((block) => proccode.trim() == block.id);
    if (blockData && blockData.handler) {
      let f = thread.peekStackFrame();
      let args = {};
      for (let arg in f.params) {
        args[arg] = f.params[arg];
      }
      blockData.handler(args, thread.target.id);
    }
    return oldStepToProcedure.call(this, thread, proccode);
  };
  if (getEditorMode() === "editor") {
    const interval = setInterval(() => {
      if (typeof Blockly === "object" && Blockly.getMainWorkspace()) {
        injectWorkspace();
        clearInterval(interval);
      }
    }, 100);
  }
  tab.addEventListener("urlChange", () => getEditorMode() === "editor" && injectWorkspace());
}
