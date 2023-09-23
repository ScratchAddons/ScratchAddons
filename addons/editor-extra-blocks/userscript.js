export default async function ({ addon, msg }) {
  if (!addon.tab.redux.state) return console.warn("Redux is not available!");
  addon.tab.redux.initialize();

  const UPDATE_TOOLBOX_ACTION = "scratch-gui/toolbox/UPDATE_TOOLBOX";

  const xmlParser = new DOMParser();
  const xmlSerializer = new XMLSerializer();

  const vm = addon.tab.traps.vm;

  function encodeXML(string) {
    return string
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  const reduxStateListener = async (e) => {
    if (e.detail.action.type === UPDATE_TOOLBOX_ACTION && !e.detail.action.saExtraBlocks) {
      const toolboxXML = xmlParser.parseFromString(e.detail.action.toolboxXML, "text/xml");

      const insertAfter = (referenceBlockOpcode, seperator, ...newBlocks) => {
        const referenceBlock = toolboxXML.querySelectorAll(`[type="${referenceBlockOpcode}"`)[0];

        const newBlockXMLs = [];
        if (seperator) {
          const seperatorXML = toolboxXML.createElement("sep");
          seperatorXML.setAttribute("gap", 36);
          newBlockXMLs.push(seperatorXML);
        }
        for (const newBlock of newBlocks) {
          const newBlockXML = toolboxXML.createElement("block");
          newBlockXML.setAttribute("type", newBlock.type);
          if (newBlock.innerHTML) newBlockXML.innerHTML = newBlock.innerHTML;
          newBlockXMLs.push(newBlockXML);
        }

        referenceBlock.after(...newBlockXMLs);
      };

      let defaultVariableName = "my variable";
      if (vm.editingTarget) {
        let variableIDs = Object.keys(vm.editingTarget.variables);
        if (variableIDs.length !== 0) {
          defaultVariableName = vm.editingTarget.variables[variableIDs[0]].name;
        } else {
          const stage = vm.runtime.getTargetForStage();
          if (stage) {
            variableIDs = Object.keys(stage.variables);
            if (variableIDs.length !== 0) {
              defaultVariableName = stage.variables[variableIDs[0]].name;
            }
          }
        }
      }

      insertAfter(
        "control_repeat_until",
        false,

        { type: "control_while" },
        {
          type: "control_for_each",
          innerHTML: `
          <field name="VARIABLE">${encodeXML(defaultVariableName)}</field>
          <value name="VALUE">
              <shadow type="math_whole_number">
                  <field name="NUM">10</field>
              </shadow>
          </value>`,
        }
      );

      insertAfter(
        "event_broadcastandwait",
        true,

        {
          type: "event_whentouchingobject",
          innerHTML: `
        <value name="TOUCHINGOBJECTMENU">
          <shadow type="event_touchingobjectmenu">
          </shadow>
        </value>`,
        }
      );

      insertAfter("sensing_loudness", false, { type: "sensing_loud" });

      if (addon.settings.get("counterBlocks")) {
        insertAfter(
          "control_delete_this_clone",
          true,

          { type: "control_get_counter" },
          { type: "control_incr_counter" },
          { type: "control_clear_counter" }
        );
      }

      if (addon.settings.get("uselessBlocks")) {
        insertAfter(
          "motion_sety",
          true,

          { type: "motion_align_scene" }
        );

        insertAfter(
          "motion_sety",
          true,

          {
            type: "motion_scroll_right",
            innerHTML: `
            <value name="DISTANCE">
              <shadow type="math_number">
                  <field name="NUM">10</field>
              </shadow>
            </value>`,
          },
          {
            type: "motion_scroll_up",
            innerHTML: `
            <value name="DISTANCE">
              <shadow type="math_number">
                  <field name="NUM">10</field>
              </shadow>
            </value>`,
          }
        );

        insertAfter(
          "motion_direction",
          true,

          { type: "motion_xscroll" },
          { type: "motion_yscroll" }
        );

        insertAfter(
          "looks_hide",
          false,

          { type: "looks_hideallsprites" }
        );

        insertAfter(
          "looks_setsizeto",
          true,

          {
            type: "looks_setstretchto",
            innerHTML: `
            <value name="STRETCH">
              <shadow type="math_number">
                  <field name="NUM">100</field>
              </shadow>
            </value>`,
          },
          {
            type: "looks_changestretchby",
            innerHTML: `
            <value name="CHANGE">
              <shadow type="math_number">
                  <field name="NUM">10</field>
              </shadow>
            </value>`,
          }
        );

        insertAfter(
          "control_for_each",
          false,

          { type: "control_all_at_once" }
        );

        insertAfter(
          "sensing_username",
          false,

          { type: "sensing_userid" }
        );
      }

      addon.tab.redux.dispatch({
        type: UPDATE_TOOLBOX_ACTION,
        toolboxXML: xmlSerializer.serializeToString(toolboxXML),
        saExtraBlocks: true,
      });
    }
  };

  const updateToolbox = () => {
    if (vm.editingTarget) {
      vm.emitWorkspaceUpdate();
    }
  };

  const onEnabled = () => {
    addon.tab.redux.addEventListener("statechanged", reduxStateListener);
    updateToolbox();
  };

  onEnabled();

  addon.settings.addEventListener("change", updateToolbox);

  addon.self.addEventListener("disabled", () => {
    addon.tab.redux.removeEventListener("statechanged", reduxStateListener);
    updateToolbox();
  });

  addon.self.addEventListener("reenabled", onEnabled);
}
