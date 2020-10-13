export default class Account extends EventTarget {
  constructor() {
    super();
  }
  getMsgCount() {
    return scratchAddons.methods.getMsgCount();
  }
  getMessages(...args) {
    return scratchAddons.methods.getMessages(...args);
  }
  clearMessages() {
    return scratchAddons.methods.clearMessages();
  }
}

// TODO: should this be an event target?
