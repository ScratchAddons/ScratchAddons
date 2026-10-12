class FakePointerEvent extends PointerEvent {
  // These events are fired to force Blockly to start a drag gesture.
  // Setting pointerId to an empty string allows any pointerup to end the drag.
  get pointerId() {
    return "";
  }
}

export default class DomHelpers {
  constructor(addon) {
    this.addon = addon;
    this.vm = addon.tab.traps.vm;
    /**
     * @type {eventDetails[]}
     */
    this.events = [];
  }

  /**
   * Simulate a drag and drop programmatically through javascript
   * @param selectorDrag
   * @param selectorDrop
   * @param mouseXY
   * @param [shiftKey=false]
   * @returns {boolean}
   */
  triggerDragAndDrop(selectorDrag, selectorDrop, mouseXY, shiftKey) {
    shiftKey = shiftKey || false;

    // function for triggering pointer events
    let firePointerEvent = function (type, elem, centerX, centerY) {
      elem.dispatchEvent(
        new FakePointerEvent(type, {
          bubbles: true,
          clientX: centerX,
          clientY: centerY,
          shiftKey,
        })
      );
    };

    // fetch target elements
    let elemDrag = selectorDrag; // document.querySelector(selectorDrag);
    let elemDrop = selectorDrop; // document.querySelector(selectorDrop);
    if (!elemDrag) {
      return false;
    }

    // calculate positions
    let pos = elemDrag.getBoundingClientRect();
    let center1X = Math.floor((pos.left + pos.right) / 2);
    let center1Y = Math.floor((pos.top + pos.bottom) / 2);

    // mouse over dragged element and mousedown
    firePointerEvent("pointerover", elemDrag, center1X, center1Y);
    firePointerEvent("pointerdown", elemDrag, center1X, center1Y);

    // start dragging process over to drop target
    firePointerEvent("pointermove", elemDrag, center1X, center1Y);

    if (!elemDrop) {
      if (mouseXY) {
        let center2X = mouseXY.x;
        let center2Y = mouseXY.y;
        firePointerEvent("pointermove", elemDrag, center2X, center2Y);
      }
      const workspace = this.addon.tab.traps.getWorkspace();
      // Blockly gets confused when it receives two pointerdown events (the fake one
      // and a real one) without a pointerup in between. Prevent it from canceling
      // the drag gesture when that happens.
      workspace.currentGesture_.gestureHasStarted = false;
      workspace.currentGesture_.handleWsStart = () => {};
      return false;
    }

    pos = elemDrop.getBoundingClientRect();
    let center2X = Math.floor((pos.left + pos.right) / 2);
    let center2Y = Math.floor((pos.top + pos.bottom) / 2);

    firePointerEvent("pointermove", elemDrop, center2X, center2Y);

    // trigger dragging process on top of drop target
    firePointerEvent("pointerenter", elemDrop, center2X, center2Y);
    firePointerEvent("pointerover", elemDrop, center2X, center2Y);

    // release dragged element on top of drop target
    firePointerEvent("pointerup", elemDrag, center2X, center2Y);

    return true;
  }

  bindOnce(dom, event, func, capture) {
    capture = !!capture;
    dom.removeEventListener(event, func, capture);
    dom.addEventListener(event, func, capture);
    this.events.push(new eventDetails(dom, event, func, capture));
  }

  unbindAllEvents() {
    for (const event of this.events) {
      event.dom.removeEventListener(event.event, event.func, event.capture);
    }
    this.events = [];
  }
}

/**
 * A record of an event
 */
class eventDetails {
  constructor(dom, event, func, capture) {
    this.dom = dom;
    this.event = event;
    this.func = func;
    this.capture = capture;
  }
}
