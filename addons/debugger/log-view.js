/**
 * @fileoverview LogView: A virtualized row viewer.
 * LogView requires a couple things:
 *  - A list of things to include (it does not care what these things are)
 *  - A function to convert those things to DOM elements on demand
 */

const LOG_HEIGHT = 20;
const EXTRA_ROWS_ABOVE = 5;
const EXTRA_ROWS_BELOW = 5;
const MAX_LOGS = 200000;

const clamp = (i, min, max) => Math.max(min, Math.min(max, i));

class LogView {
  constructor ({msg, addon}) {
    this.addon = addon;
    this.msg = msg;
    this.vm = addon.tab.traps.vm;

    this.logs = [];
    this.canAutoScrollToEnd = true;

    this.outerElement = document.createElement('div');
    this.outerElement.className = 'sa-debugger-log-outer';
    
    this.innerElement = document.createElement('div');
    this.innerElement.className = 'sa-debugger-log-inner';
    this.outerElement.appendChild(this.innerElement);
    this.innerElement.addEventListener('scroll', this._handleScroll.bind(this), {passive: true});
    this.innerElement.addEventListener('wheel', this._handleWheel.bind(this), {passive: true});

    this.endElement = document.createElement('div');
    this.endElement.className = 'sa-debugger-log-end';
    this.innerElement.appendChild(this.endElement);

    this.visible = false;
    this.isScrolledToEnd = true;
    this.scrollTopWhenHidden = 'end';
    this.scrollTop = 0;
    this.updateContentQueued = false;
    this.scrollToEndQueued = false;
  }

  compareLogs (a, b) {
    // to be overridden by users
    return false;
  }

  append (log) {
    this.queueUpdateContent();

    if (typeof log.text !== 'string') {
      log.text = '' + log.text;
    }

    const lastLog = this.logs[this.logs.length - 1];
    if (lastLog && this.compareLogs(lastLog, log)) {
      lastLog.count++;
      this.invalidateLogDOM(lastLog);
      return;
    }

    log.count = 1;
    this.logs.push(log);

    while (this.logs.length > MAX_LOGS) {
      this.logs.shift();
    }

    this._queueScrollToEnd();
  }

  clear () {
    this.logs.length = 0;
    this.scrollTop = 0;
    this.isScrolledToEnd = true;
    this.queueUpdateContent();
  }

  show () {
    this.visible = true;
    this.height = this.innerElement.offsetHeight;
    this.queueUpdateContent();
    if (this.scrollTopWhenHidden === 'end') {
      this._queueScrollToEnd();
    } else {
      this.innerElement.scrollTop = this.scrollTopWhenHidden;
    }
  }

  hide () {
    this.visible = false;
    this.scrollTopWhenHidden = this.isScrolledToEnd ? 'end' : this.scrollTop;
  }

  _handleScroll (e) {
    this.scrollTop = e.target.scrollTop;
    this.isScrolledToEnd = e.target.scrollTop + 5 >= e.target.scrollHeight - e.target.clientHeight;
    this.queueUpdateContent();
  }

  _handleWheel (e) {
    if (e.deltaY < 0) {
      this.isScrolledToEnd = false;
    }
  }

  buildDOM (log) {
    // to be overridden by users
    throw new Error('not implemented');
  }

  _getLogDOM (log) {
    if (!log._dom) {
      log._dom = this.buildDOM(log);
    }
    return log._dom;
  }

  invalidateAllLogDOM () {
    for (const i of this.logs) {
      this.invalidateLogDOM(i);
    }
  }

  invalidateLogDOM (log) {
    log._dom = null;
  }

  scrollIntoView (index) {
    const distanceFromTop = index * LOG_HEIGHT;
    const viewportStart = this.scrollTop;
    const viewportEnd = this.scrollTop + this.height;
    const isInView = distanceFromTop > viewportStart && distanceFromTop < viewportEnd;
    if (!isInView) {
      this.scrollTop = distanceFromTop;
      this.innerElement.scrollTop = distanceFromTop;
    }
  }

  _queueScrollToEnd () {
    if (this.visible && this.canAutoScrollToEnd && this.isScrolledToEnd && !this.scrollToEndQueued) {
      this.scrollToEndQueued = true;
      queueMicrotask(() => {
        this.scrollToEndQueued = false;
        if (this.isScrolledToEnd) {
          const scrollEnd = this.innerElement.scrollHeight - this.innerElement.offsetHeight;
          this.innerElement.scrollTop = scrollEnd;
          this.scrollTop = scrollEnd;
        }
      });
    }
  }

  queueUpdateContent () {
    if (this.visible && !this.updateContentQueued) {
      this.updateContentQueued = true;
      queueMicrotask(() => {
        this.updateContentQueued = false;
        this.updateContent();
      });
    }
  }

  updateContent () {
    const totalHeight = this.logs.length * LOG_HEIGHT;
    this.endElement.style.transform = `translateY(${totalHeight}px)`;

    const scrollStartIndex = Math.floor(this.scrollTop / LOG_HEIGHT);
    const rowsVisible = Math.ceil(this.height / LOG_HEIGHT);
    const startIndex = clamp(scrollStartIndex - EXTRA_ROWS_BELOW, 0, this.logs.length);
    const endIndex = clamp(scrollStartIndex + rowsVisible + EXTRA_ROWS_ABOVE, 0, this.logs.length);

    for (const el of Array.from(this.innerElement.children)) {
      if (el !== this.endElement) {
        el.remove();
      }
    }
    for (let i = startIndex; i < endIndex; i++) {
      const log = this.logs[i];
      const element = this._getLogDOM(log);
      element.style.transform = `translateY(${i * LOG_HEIGHT}px)`;
      this.innerElement.appendChild(element);
    }
  }
}

export default LogView;
