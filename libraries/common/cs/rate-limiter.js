/** Rate-limit a function. */
export default class RateLimiter {
  /**
   * Creates a rate limiter.
   *
   * @param {number} wait - The wait time before rate limit resets, in millisecons.
   */
  constructor(wait) {
    this.timeout = null;
    this.callback = null;
    this.wait = wait;
  }

  /**
   * Aborts the pending rate limit.
   * @param {boolean=} call - whether to call the rate-limited function. Defaults to true.
   */
  abort(call = true) {
    if (this.timeout) {
      clearTimeout(this.timeout);
      if (call) this.callback();
      this.timeout = this.callback = null;
    }
  }

  /**
   * Delays the execution of a function until the wait
   * time has passed since the last call of this function.
   * @param {function} callback - the callback.
   */
  limit(callback) {
    this.abort(false);
    this.callback = callback;
    this.timeout = setTimeout(() => {
      this.timeout = this.callback = null;
      callback();
    }, this.wait);
  }
}
