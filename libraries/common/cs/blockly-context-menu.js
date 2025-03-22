let separatorsEnabled = false;

export async function enableContextMenuSeparators(tab) {
  if (separatorsEnabled) return;
  separatorsEnabled = true;
  const Blockly = await tab.traps.getBlockly();
  if (!Blockly.registry) return;

  const oldMenuItemCreateDom = Blockly.MenuItem.prototype.createDom;
  Blockly.MenuItem.prototype.createDom = function (...args) {
    const element = oldMenuItemCreateDom.call(this, ...args);
    if (this.content.saSeparator) {
      element.style.borderTop = "1px solid hsla(0, 0%, 0%, 0.15)";
      element.style.backgroundClip = "padding-box";
    }
    return element;
  };
}

export function addSeparator(item) {
  /* Store .saSeparator as a property of text/displayText so that MenuItem.createDom()
       (overridden in enableSeparators() above) can receive it */
  if (item.saSeparator) return; // addSeparator() was already called for this item
  item.saSeparator = true;
  if (typeof item.displayText === "function") {
    const oldDisplayText = item.displayText;
    item.displayText = (scope) => {
      let text = oldDisplayText(scope);
      text = document.createTextNode(text);
      text.saSeparator = true;
      return text;
    };
  } else if (typeof item.displayText === "string") {
    item.displayText = document.createTextNode(item.displayText);
    item.displayText.saSeparator = true;
  } else {
    item.text = document.createTextNode(item.text);
    item.text.saSeparator = true;
  }
  return item;
}
