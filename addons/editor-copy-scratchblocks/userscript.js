export default async function({ addon, console }) {
  const blockly = await addon.tab.traps.getBlockly();

  const blocks = {};

  // INPUTS
  blocks["math_number"] = {
    func: (block) => {
      const content = block.getFieldValue("NUM");
      return /^[0-9e.-]*$/.test(content) ? `(${content})` : `[${sanitize(content, strInpSanitizations)}]`;
    },
  };
  blocks["math_angle"] = blocks["math_number"];
  blocks["math_integer"] = blocks["math_number"];
  blocks["math_whole_number"] = blocks["math_number"];
  blocks["math_positive_number"] = blocks["math_number"];
  blocks["text"] = {
    func: (block) => `[${sanitize(block.getFieldValue("TEXT"), strInpSanitizations)}]`,
  };

  // MOTION
  blocks["motion_movesteps"] = ["move ", { input: "STEPS" }, " steps"];
  blocks["motion_turnright"] = ["turn right ", { input: "DEGREES" }, " degrees"];
  blocks["motion_turnleft"] = ["turn right ", { input: "DEGREES" }, " degrees"];
  blocks["motion_pointindirection"] = ["point in direction ", { input: "DIRECTION" }];
  blocks["motion_pointtowards_menu"] = { numDropdownField: "TOWARDS" };
  blocks["motion_pointtowards"] = ["point towards ", { input: "TOWARDS" }];
  blocks["motion_goto_menu"] = { numDropdownField: "TO" };
  blocks["motion_gotoxy"] = ["go to x: ", { input: "X" }, " y: ", { input: "Y" }];
  blocks["motion_goto"] = ["go to ", { input: "TO" }];
  blocks["motion_glidesecstoxy"] = ["glide ", { input: "SECS" }, " to x: ", { input: "X" }, " y: ", { input: "Y" }];
  blocks["motion_glideto_menu"] = { numDropdownField: "TO" };
  blocks["motion_glideto"] = ["glide ", { input: "SECS" }, " to ", { input: "TO" }];
  blocks["motion_changexby"] = ["change x by ", { input: "DX" }];
  blocks["motion_setx"] = ["set x to ", { input: "X" }];
  blocks["motion_changeyby"] = ["change y by ", { input: "DY" }];
  blocks["motion_sety"] = ["set y to ", { input: "Y" }];
  blocks["motion_ifonedgebounce"] = ["if on edge, bounce"];
  blocks["motion_setrotationstyle"] = ["set rotation style ", { dropdownField: "STYLE" }];
  blocks["motion_xposition"] = ["(x position", { override: "motion" }, ")"];
  blocks["motion_yposition"] = ["(y position", { override: "motion" }, ")"];
  blocks["motion_direction"] = ["(direction", { override: "motion" }, ")"];
  blocks["motion_scroll_right"] = ["scroll right", { input: "DISTANCE" }, " :: motion"]; // obsolete
  blocks["motion_scroll_up"] = ["scroll up", { input: "DISTANCE" }, " :: motion"]; // obsolete
  blocks["motion_align_scene"] = ["align scene ", { dropdownField: "ALIGNMENT" }, " :: motion"]; // obsolete
  blocks["motion_xscroll"] = ["(x scroll :: motion)"]; // obsolete
  blocks["motion_yscroll"] = ["(y scroll :: motion)"]; // obsolete

  // LOOKS
  blocks["looks_sayforsecs"] = ["say ", { input: "MESSAGE" }, " for ", { input: "SECS" }, " seconds"];
  blocks["looks_say"] = ["say ", { input: "MESSAGE" }];
  blocks["looks_thinkforsecs"] = ["think ", { input: "MESSAGE" }, " for ", { input: "SECS" }, " seconds"];
  blocks["looks_think"] = ["think ", { input: "MESSAGE" }];
  blocks["looks_show"] = ["show"];
  blocks["looks_hide"] = ["hide"];
  blocks["looks_hideallsprites"] = ["hide all sprites"]; // obsolete
  blocks["looks_changeeffectby"] = ["change ", { dropdownField: "EFFECT" }, " effect by ", { input: "CHANGE" }];
  blocks["looks_seteffectto"] = ["set ", { dropdownField: "EFFECT" }, " to ", { input: "VALUE" }];
  blocks["looks_cleargraphiceffects"] = ["clear graphic effects"];
  blocks["looks_changesizeby"] = ["change size by ", { input: "CHANGE" }];
  blocks["looks_setsizeto"] = ["set size to ", { input: "SIZE" }, " %"];
  blocks["looks_size"] = ["(size", { override: "looks" }, ")"];
  blocks["looks_costume"] = { numDropdownField: "COSTUME" };
  blocks["looks_switchcostumeto"] = ["switch costume to ", { input: "COSTUME" }];
  blocks["looks_nextcostume"] = ["next costume"];
  blocks["looks_switchbackdropto"] = ["switch backdrop to ", { input: "BACKDROP" }];
  blocks["looks_backdrops"] = { numDropdownField: "BACKDROP" };
  blocks["looks_gotofrontback"] = ["go to ", { dropdownField: "FRONT_BACK" }, " layer"];
  blocks["looks_goforwardbackwardlayers"] = ["go ", { dropdownField: "FORWARD_BACKWARD" }, " ", { input: "NUM" }, " layers"];
  blocks["looks_backdropnumbername"] = ["(backdrop ", {dropdownField: "NUMBER_NAME"}, ")"];
  blocks["looks_costumenumbername"] = ["(costume ", {dropdownField: "NUMBER_NAME"}, ")"];
  blocks["looks_switchbackdroptoandwait"] = ["switch backdrop to ", {input: "BACKDROP"}, " and wait"];
  blocks["looks_nextbackdrop"] = ["next backdrop"];

  const commonSanitizations = [
    { searchValue: "\\", replacer: "\\\\" },
  ];

  const strInpSanitizations = [
    ...commonSanitizations,
    { searchValue: /^\/scratchblocks$/g, replacer: "\\/scratchblocks" },
    { searchValue: / v$/g, replacer: " \\v" },
    { searchValue: "]", replacer: "\\]" },
  ];

  const blockSanitizations = [
    ...commonSanitizations,
    { searchValue: "::", replacer: ":\\:" },
    { searchValue: "[", replacer: "\\[" },
    { searchValue: "(", replacer: "\\(" },
    { searchValue: "<", replacer: "\\<" },
    { searchValue: "{", replacer: "\\{" },
    { searchValue: "[/scratchblocks]", replacer: "[\\/scratchblocks]" },
    { searchValue: /@(?=greenFlag|stopSign|turnLeft|turnRight|loopArrow|addInput|delInput|list)/g, replacer: "\\@" },
    { searchValue: "//", replacer: "\//" },
  ];

  function sanitize(text, sanitizations) {
    for (const sanitization of sanitizations)
      text = text.replaceAll(sanitization.searchValue, sanitization.replacer);

    return text;
  }

  function getBlockCode(block, sanitized) {
    const blockData = blocks[block.type];

    if (blockData.func) {
      return blockData.func(block, sanitized);
    }

    if (blockData.numDropdownField) {
      const sanitizations = [...blockSanitizations, { searchValue: ")", replacer: "\\)" }];
      return `(${sanitize(blockData.numDropdownField, sanitizations)} v)`;
    }

    let output = "";

    for (const component of blockData) {
      if (component.input) {
        output += getBlockCode(block.getInputTargetBlock(component.input), sanitized);
      } else if (component.dropdownField) {
        const sanitizations = [
          ...commonSanitizations,
          { searchValue: /^\/scratchblocks$/g, replacer: "\\/scratchblocks" },
          { searchValue: "]", replacer: "\\]" },
        ];
        output += `[${sanitize(block.getField(component.dropdownField).text_, sanitizations)} v]`;
      } else {
        output += component;
      }
    }

    return output;
  }

  addon.tab.createBlockContextMenu((items) => {
    items.push({
      enabled: true,
      text: "Copy scripts as scratchblocks",
      callback: () => {
        const topBlocks = blockly.getMainWorkspace().getTopBlocks();
        console.log(topBlocks);
      },
      separator: true,
    });

    return items;
  }, { workspace: true });

  addon.tab.createBlockContextMenu((items, block) => {
    items.push({
      enabled: true,
      text: "Log block",
      callback: () => {
        console.log(block);
      },
      separator: true,
    }, {
      enabled: true,
      text: "Log input names",
      callback: () => {
        console.log(block.inputList.map(input => input.name));
      },
    }, {
      enabled: true,
      text: "Log block scratchblocks",
      callback: () => console.log(getBlockCode(block)),
    });

    return items;
  }, { blocks: true, flyout: true });
}
