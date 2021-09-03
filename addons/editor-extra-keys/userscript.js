export default async function ({ addon, global, cons, msg }) {
  const Blockly = await addon.tab.traps.getBlockly();

  function appendKeys(keys) {
    keys.push(...[
      ['`', '`'],
      ['-', '-'],
      ['=', '='],
      ['[', '['],
      [']', ']'],
      ['\\', '\\'],
      [';', ';'],
      ['\'', '\''],
      [',', ','],
      ['.', '.'],
      ['/', '/']
    ])
    keys.splice(5, 0, [msg("enter-key"), 'enter']);
  }

  Blockly.Blocks['sensing_keyoptions'] = {
    jsonInitOriginal: undefined,
    initOriginal: Blockly.Blocks['sensing_keyoptions'].init,
    init: function () {
      if (this.jsonInitOriginal === undefined)
        this.jsonInitOriginal = this.jsonInit;
      this.jsonInit = function (obj) {
        appendKeys(obj.args0[0].options);
        this.jsonInitOriginal(obj);
      }
      this.initOriginal();
    }
  }


  Blockly.Blocks['event_whenkeypressed'] = {
    jsonInitOriginal: undefined,
    initOriginal: Blockly.Blocks['event_whenkeypressed'].init,
    init: function () {
      if (this.jsonInitOriginal === undefined)
        this.jsonInitOriginal = this.jsonInit;
      this.jsonInit = function (obj) {
        appendKeys(obj.args0[0].options);
        this.jsonInitOriginal(obj);
      }
      this.initOriginal();
    }
  }

  addon.tab.traps.vm.emitWorkspaceUpdate();
}