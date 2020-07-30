export default class Account extends EventTarget {
  constructor() {
    super();
  }
  getMsgCount() {
    return scratchAddons.methods.getMsgCount();
  }
}

// TODO: should this be an event target?
