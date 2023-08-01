// https://github.com/fregante/text-field-edit/issues/16
function safeTextInsert(text) {
    if (text === '') {
        return document.execCommand('delete');
    }
    return document.execCommand('insertText', false, text);
}
function insertTextFirefox(field, text) {
    // Found on https://www.everythingfrontend.com/posts/insert-text-into-textarea-at-cursor-position.html 🎈
    field.setRangeText(text, field.selectionStart || 0, field.selectionEnd || 0, 'end');
    field.dispatchEvent(new InputEvent('input', {
        data: text,
        inputType: 'insertText',
    }));
}
/** Inserts `text` at the cursor’s position, replacing any selection, with **undo** support and by firing the `input` event. */
export function insert(field, text) {
    var document = field.ownerDocument;
    var initialFocus = document.activeElement;
    if (initialFocus !== field) {
        field.focus();
    }
    if (!safeTextInsert(text)) {
        insertTextFirefox(field, text);
    }
    if (initialFocus === document.body) {
        field.blur();
    }
    else if (initialFocus instanceof HTMLElement && initialFocus !== field) {
        initialFocus.focus();
    }
}
/** Replaces the entire content, equivalent to `field.value = text` but with **undo** support and by firing the `input` event. */
export function set(field, text) {
    field.select();
    insert(field, text);
}
/** Get the selected text in a field or an empty string if nothing is selected. */
export function getSelection(field) {
    return field.value.slice(field.selectionStart, field.selectionEnd);
}
/** Adds the `wrappingText` before and after field’s selection (or cursor). If `endWrappingText` is provided, it will be used instead of `wrappingText` at on the right. */
export function wrapSelection(field, wrap, wrapEnd) {
    var selectionStart = field.selectionStart, selectionEnd = field.selectionEnd;
    var selection = getSelection(field);
    insert(field, wrap + selection + (wrapEnd !== null && wrapEnd !== void 0 ? wrapEnd : wrap));
    // Restore the selection around the previously-selected text
    field.selectionStart = selectionStart + wrap.length;
    field.selectionEnd = selectionEnd + wrap.length;
}
/** Finds and replaces strings and regex in the field’s value, like `field.value = field.value.replace()` but better */
export function replace(field, searchValue, replacer, cursor) {
    if (cursor === void 0) { cursor = 'select'; }
    /** Remembers how much each match offset should be adjusted */
    var drift = 0;
    field.value.replace(searchValue, function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        // Select current match to replace it later
        var matchStart = drift + args[args.length - 2];
        var matchLength = args[0].length;
        field.selectionStart = matchStart;
        field.selectionEnd = matchStart + matchLength;
        var replacement = typeof replacer === 'string' ? replacer : replacer.apply(void 0, args);
        insert(field, replacement);
        if (cursor === 'select') {
            // Select replacement. Without this, the cursor would be after the replacement
            field.selectionStart = matchStart;
        }
        drift += replacement.length - matchLength;
        return replacement;
    });
}
