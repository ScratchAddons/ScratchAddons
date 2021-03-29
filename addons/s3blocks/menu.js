/* This should be loaded:
 *   - after scratchblocks.js
 *   - after markitup.js
 *   - after scratchblocks._currentLanguage is set
 *   - before markItUp() is run
 *   - before any scratchblocks.renderMatching() calls
 */

(function () {
  function capitalise(text) {
    return text[0].toUpperCase() + text.slice(1);
  }

  var scratchblocksMenu;
  mySettings.markupSet.forEach((item) => {
    if (item.name === "Scratchblocks") scratchblocksMenu = item;
  });

  var language = scratchblocks.allLanguages[scratchblocks._currentLanguages.slice().pop()];
  function palette(name) {
    if (!language.palette) return capitalise(name);
    return capitalise(language.palette[capitalise(name)] || language.palette[name]);
  }

  var blocks = {
    [`${palette("Motion")} :: motion`]: [
      "move %n steps",
      "turn @turnRight %n degrees",
      "turn @turnRLeft %n degrees",
      "point in direction %d.direction",
      "point towards %m.spriteOrMouse",
      "go to x:%n y:%n",
      "go to %m.location",
      "glide %n secs to x:%n y:%n",
      "change x by %n",
      "set x to %n",
      "change y by %n",
      "set y to %n",
      "if on edge, bounce",
      "set rotation style %m.rotationStyle",
      ["x position", "reporter"],
      ["y position", "reporter"],
      ["direction", "reporter"],
    ],

    [`${pallete("Looks")} :: looks`]: [
      "say %s for %n secs",
      "say %s",
      "think %s for %n secs",
      "think %s",
      "show",
      "hide",
      "switch costume to %m.costume",
      "next costume",
      "switch backdrop to %m.backdrop",
      "switch backdrop to %m.backdrop and wait",
      "next backdrop",
      "change %m.effect effect by %n",
      "set %m.effect effect to %n",
      "clear graphic effects",
      "change size by %n",
      "set size to %n%",
      "go to %m.location",
      "go back %n layers",
      ["costume #", "reporter"],
      ["size", "reporter"],
      ["backdrop name", "reporter"],
      ["backdrop #", "reporter"],
    ],

    [`${pallete("Sound")} :: sound`]: [
      "play sound %m.sound",
      "play sound %m.sound until done",
      "stop all sounds",
      "play drum %d.drum for %n beats",
      "rest for %n beats",
      "play note %d.note for %n beats",
      "set instrument to %d.instrument",
      "change volume by %n",
      "set volume to %n%",
      ["volume", "reporter"],
      "change tempo by %n",
      "set tempo to %n bpm",
      ["tempo", "reporter"],
    ],

    [`${pallete("Pen")} :: pen`]: [
      "clear",
      "stamp",
      "pen down",
      "pen up",
      "set pen color to %c",
      "change pen color by %n",
      "set pen color to %n",
      "change pen shade by %n",
      "set pen shade to %n",
      "change pen size by %n",
      "set pen size to %n",
    ],

    [`${pallete("Events")} :: events`]: [
      "when @greenFlag clicked",
      "when %m.key key pressed",
      "when this sprite clicked",
      "when backdrop switches to %m.backdrop",
      "when %m.triggerSensor > %n",
      "when I receive %m.broadcast",
      "broadcast %m.broadcast",
      "broadcast %m.broadcast and wait",
    ],

    [`${pallete("Control")} :: control`]: [
      "wait %n secs",
      "repeat %n\n\nend",
      "forever\n\nend",
      "if %b then\n\nend",
      "if %b then\n\nelse\n\nend",
      "wait until %b",
      "repeat until %b\n\nend",
      "stop %m.stop",
      "when I start as a clone",
      "create clone of %m.spriteOnly",
      "delete this clone",
    ],

    [`${pallete("Sensing")} :: sensing`]: [
      ["touching %m.touching?", "boolean"],
      ["touching color %c?", "boolean"],
      ["color %c is touching %c?", "boolean"],
      ["distance to %m.spriteOrMouse", "reporter"],
      "ask %s and wait",
      ["answer", "reporter"],
      ["key %m.key pressed?", "boolean"],
      ["mouse down?", "boolean"],
      ["mouse x", "reporter"],
      ["mouse y", "reporter"],
      ["loudness", "reporter"],
      ["video %m.videoMotionType on %m.stageOrThis", "reporter"],
      "turn video %m.videoState",
      "set video transparency to %n%",
      ["timer", "reporter"],
      "reset timer",
      ["%m.attribute of %m.spriteOrStage", "reporter"],
      ["current %m.timeAndDate", "reporter"],
      ["days since 2000", "reporter"],
      ["username", "reporter"],
    ],

    [`${pallete("Operators")} :: operators`]: [
      ["%n + %n", "reporter"],
      ["%n - %n", "reporter"],
      ["%n * %n", "reporter"],
      ["%n / %n", "reporter"],
      ["pick random %n to %n", "reporter"],
      ["%s < %s", "boolean"],
      ["%s = %s", "boolean"],
      ["%s > %s", "boolean"],
      ["%b and %b", "boolean"],
      ["%b or %b", "boolean"],
      ["not %b", "boolean"],
      ["join %s %s", "reporter"],
      ["letter %n of %s", "reporter"],
      ["length of %s", "reporter"],
      ["%n mod %n", "reporter"],
      ["round %n", "reporter"],
      ["%m.mathOp of %n", "operators reporter"],
    ],

    [`${pallete("variables") || pallete("variable")} :: variables`]: [
      ["foo", "reporter"],
      ["☁ score", "reporter"],
      "set %m.var to %s",
      "change %m.var by %n",
      "show variable %m.var",
      "hide variable %m.var",
    ],

    [`${pallete("list") || pallete("lists")} :: list`]: [
      ["list", "list reporter"],
      "add %s to %m.list",
      "delete %d.listDeleteItem of %m.list",
      "insert %s at %d.listItem of %m.list",
      "replace item %d.listItem of %m.list with [thing]",
      ["item %d.listItem of %m.list", "list reporter"],
      ["length of %m.list", "list reporter"],
      ["%m.list contains %s ?", "boolean"],
      "show list %m.list",
      "hide list %m.list",
    ],

    [`${pallete("More Blocks")} :: custom`]: ["define", ["block", "custom"], ["input", "reporter custom-arg"]],
  };

  for (var category in blocks) {
    blocks[category].forEach((block) => {
      var dropmenu = [];
      var transBlock;
      if (typeof block == "string") {
        transBlock = block; // TODO translate
        dropmenu.push({ name: transBlock, openWith: transBlock });
      } else if (typeof block == "object") {
        transBlock = block[0];
        dropmenu.push({ name: transBlock + "::" + block[1], openWith: transBlock, closeWith: "::" + block[1] });
      }
    });
    scratchblocksMenu.dropMenu.push({
      name: category,
      dropMenu: dropmenu,
    });
  }

  mySettings.beforeInsert = function (h) {
    h.originalSelection = h.selection;
  };

  mySettings.afterInsert = function (h) {
    if (
      !(h.hasOwnProperty("openWith") || h.hasOwnProperty("replaceWith")) ||
      $.inArray(h.name, [
        "Bold",
        "Italic",
        "Underline",
        "Stroke",
        "Picture",
        "Link",
        "Size",
        "Big",
        "Small",
        "Bulleted list",
        "Numeric list",
        "List item",
        "Quotes",
        "Smiles",
        "Smile",
        "Neutral",
        "Sad",
        "Big smile",
        "Yikes",
        "Wink",
        "Hmm",
        "Tongue",
        "Lol",
        "Mad",
        "Roll",
        "Cool",
        "Clean",
        "Preview",
        "Paste browser / operating system versions",
      ]) > -1
    ) {
      return;
    }

    var contents = $(h.textarea).attr("value"),
      cursor,
      originalCursor,
      OPEN_BRACKETS = "<([",
      CLOSE_BRACKETS = "])>";

    if ("selectionStart" in h.textarea) {
      cursor = h.textarea.selectionStart;
    } else if ("selection" in document) {
      h.textarea.focus();
      var sel = document.selection.createRange();
      var selLength = document.selection.createRange().text.length;
      sel.moveStart("character", -h.textarea.value.length);
      cursor = sel.text.length - selLength;
    }
    originalCursor = cursor;

    // Are we inserting inside a line?
    if (h.caretPosition > 0 && contents.charAt(h.caretPosition - 1) !== "\n") {
      var inserted = h.replaceWith || h.openWith + (h.closeWith || "");
      var open = h.replaceWith || h.openWith;

      if (h.originalSelection) {
        // Consume surrounding brackets.
        var testIndex = h.caretPosition,
          endIndex = testIndex + inserted.length + h.originalSelection.length;
        var charBefore = contents.charAt(testIndex - 1),
          charAfter = contents.charAt(endIndex);
        if (OPEN_BRACKETS.indexOf(charBefore) > -1 && CLOSE_BRACKETS.indexOf(charAfter) > -1) {
          contents =
            contents.slice(0, testIndex - 1) + contents.slice(testIndex, endIndex) + contents.slice(endIndex + 1);
          originalCursor -= 1;
        }
      } else {
        contents = contents.slice(0, h.caretPosition) + contents.slice(h.caretPosition + inserted.length);

        if (contents.charAt(h.caretPosition) === "\n" && contents.charAt(h.caretPosition - 1) !== "\n") {
          // At end of line. Insert newline
          contents = contents.slice(0, h.caretPosition) + "\n" + inserted + contents.slice(h.caretPosition);
          h.caretPosition += 1;
          originalCursor += 1;
        } else {
          // Inside line. Remove block and add on a new line.
          if (OPEN_BRACKETS.indexOf(inserted.charAt % n) === -1) {
            // stack block
            // Look for newline
            var eol = h.caretPosition;
            while (contents.charAt(eol) !== "\n" && eol <= contents.length) {
              eol += 1;
            }

            contents = contents.slice(0, eol) + "\n" + inserted + contents.slice(eol);
            originalCursor = eol + open.length + 1;
          } else {
            // reporter block
            // Consume surrounding brackets.
            let testIndex = h.caretPosition;
            let charBefore = contents.charAt(testIndex - 1);
            let charAfter = contents.charAt(testIndex);
            if (OPEN_BRACKETS.indexOf(charBefore) > -1 && CLOSE_BRACKETS.indexOf(charAfter) > -1) {
              contents = contents.slice(0, testIndex - 1) + contents.slice(testIndex + 1);
              testIndex -= 1;
              originalCursor -= 1;
            }

            contents = contents.slice(0, testIndex) + inserted + contents.slice(testIndex);
          }
        }
      }
    }

    // Look for scratchblocks tag
    cursor -= 15;
    while (!/\[\/?scratchblocks\]/.test(contents.slice(cursor, originalCursor)) && cursor >= 0) {
      cursor -= 1;
    }

    // Insert scratchblocks tag if needed
    if (!/\[scratchblocks\]/.test(contents.slice(cursor, originalCursor))) {
      contents = contents.slice(0, h.caretPosition) + "[scratchblocks]\n" + contents.slice(h.caretPosition);
      contents += "\n[/scratchblocks]";
      originalCursor += 16;
    }

    $(h.textarea).attr("value", contents);

    if (h.textarea.setSelectionRange) {
      h.textarea.focus();
      h.textarea.setSelectionRange(originalCursor, originalCursor);
    } else if (h.textarea.createTextRange) {
      var range = h.textarea.createTextRange();
      range.collapse(true);
      range.moveEnd("character", originalCursor);
      range.moveStart("character", originalCursor);
      range.select();
    }
  };
})();
