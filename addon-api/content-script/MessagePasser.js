/**
 * Handles message passing for content scripts.
 */

export default class MessagePasser {
  constructor(addonObject) {
    this._addonId = addonObject.id;
  }

  sendMessage(message, callback) {
    scratchAddons.methods
      .sendMessage(message, this._addonId)
      .then((response) => {
        if (callback) callback(response);
      })
      .catch(console.error);
  }
}
