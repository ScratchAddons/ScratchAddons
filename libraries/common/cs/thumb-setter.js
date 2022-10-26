export default class ThumbSetter {
  constructor(projectId, beforeUpload) {
    this._input = null;
    this._beforeUpload = beforeUpload;
    this.projectId = projectId || location.pathname.replace(/\D/g, "");
    this.onFinished = (value) => value;
  }

  _initPromise() {
    this._callback = null;
    this._errorCallback = null;
    this.finished = new Promise((resolve, reject) => {
      this._callback = resolve;
      this._errorCallback = reject;
    });
  }

  addFileInput() {
    const input = (this._input = document.createElement("input"));
    input.type = "file";
    input.accept = "image/*";
    input.classList.add("sa-animated-thumb-input");
    input.addEventListener("change", this.onInput.bind(this), { once: true });
    input.addEventListener("cancel", this.onCancel.bind(this), { once: true });
    document.body.appendChild(input);
  }

  showInput() {
    if (this._input) this._input.click();
  }

  onInput() {
    let promise = Promise.resolve();
    const file = this._input?.files?.[0];
    if (file) {
      if (this._beforeUpload) {
        promise = this._beforeUpload(file).catch((e) => {
          if (e !== "Aborted") throw e;
        });
      }
      promise.then(() => this.upload(file));
    }
    promise.finally(() => this.removeFileInput());
  }

  onCancel() {
    this.removeFileInput();
    this._initPromise();
    this.onFinished(this.finished);
    this._callback(true);
  }

  removeFileInput() {
    if (this._input) {
      this._input.remove();
      this._input = null;
    }
  }

  getCSRFToken() {
    const tokens = /scratchcsrftoken=([\w]+)/.exec(document.cookie);
    return tokens[1];
  }

  async upload(file) {
    this._initPromise();
    this.onFinished(this.finished);
    try {
      const resp = await fetch(`https://scratch.mit.edu/internalapi/project/thumbnail/${this.projectId}/set/`, {
        method: "POST",
        body: file,
        credentials: "include",
        headers: {
          "X-CSRFToken": this.getCSRFToken(),
        },
      });
      if (!resp.ok) {
        const err = new Error(`Server responded with: ${resp.status}`);
        err.status = resp.status;
        throw err;
      }
    } catch (e) {
      console.error("Error while uploading a thumbnail:", e.message);
      this._errorCallback(e.status);
      return;
    }
    this._callback();
  }
}
