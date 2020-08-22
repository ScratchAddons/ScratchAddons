/* https://github.com/fregante/text-field-edit @ v3.1.0 */

export default (function (exports) {
  "use strict";

  function insertTextFirefox(field, text) {
    field.setRangeText(text, field.selectionStart || 0, field.selectionEnd || 0, "end");
    field.dispatchEvent(
      new InputEvent("input", {
        data: text,
        inputType: "insertText",
        isComposing: false,
      })
    );
  }
  function insert(field, text) {
    var document = field.ownerDocument;
    var initialFocus = document.activeElement;
    if (initialFocus !== field) {
      field.focus();
    }
    if (!document.execCommand("insertText", false, text)) {
      insertTextFirefox(field, text);
    }
    if (initialFocus === document.body) {
      field.blur();
    } else if (initialFocus instanceof HTMLElement && initialFocus !== field) {
      initialFocus.focus();
    }
  }
  function set(field, text) {
    field.select();
    insert(field, text);
  }
  function getSelection(field) {
    return field.value.slice(field.selectionStart, field.selectionEnd);
  }
  function wrapSelection(field, wrap, wrapEnd) {
    var selectionStart = field.selectionStart,
      selectionEnd = field.selectionEnd;
    var selection = getSelection(field);
    insert(field, wrap + selection + (wrapEnd !== null && wrapEnd !== void 0 ? wrapEnd : wrap));
    field.selectionStart = selectionStart + wrap.length;
    field.selectionEnd = selectionEnd + wrap.length;
  }
  function replace(field, searchValue, replacer) {
    var drift = 0;
    field.value.replace(searchValue, function () {
      var args = [];
      for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
      }
      var matchStart = drift + args[args.length - 2];
      var matchLength = args[0].length;
      field.selectionStart = matchStart;
      field.selectionEnd = matchStart + matchLength;
      var replacement = typeof replacer === "string" ? replacer : replacer.apply(void 0, args);
      insert(field, replacement);
      field.selectionStart = matchStart;
      drift += replacement.length - matchLength;
      return replacement;
    });
  }

  exports.getSelection = getSelection;
  exports.insert = insert;
  exports.replace = replace;
  exports.set = set;
  exports.wrapSelection = wrapSelection;

  return exports;
})({});
