export default class ThumbSetter {
    constructor (messagesFn, projectId) {
        this._input = null;
        this.msg = messagesFn;
        this.projectId = projectId || location.pathname.replace(/\D/g,'');
    }

    addFileInput () {
        const input = this._input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.classList.add("sa-animated-thumb-input");
        input.addEventListener("change", this.onInput.bind(this), {once: true});
        document.body.appendChild(input);
    }

    showInput () {
        if (this._input) this._input.click();
    }

    onInput () {
        let promise = Promise.resolve();
        if (this._input && this._input.files && this._input.files[0]) {
            promise = this.upload(this._input.files[0]);
        }
        promise.finally(() => this.removeFileInput());
    }

    removeFileInput () {
        if (this._input) {
            this._input.remove();
            this._input = null;
        }
    }

    getCSRFToken () {
        const tokens = /scratchcsrftoken=([\w]+)/.exec(document.cookie);
        return tokens[1];
    }

    async upload (file) {
        try {
            const resp = await fetch(
                `https://scratch.mit.edu/internalapi/project/thumbnail/${this.projectId}/set/`,
                {
                    method: "POST",
                    body: file,
                    credentials: "include",
                    headers: {
                        "X-CSRFToken": this.getCSRFToken()
                    }
                }
            );
            if (!resp.ok) {
              const err = new Error(`Server responded with: ${resp.status}`);
              err.status = resp.status;
              throw err;
            }
        } catch (e) {
            console.error("Error while uploading a thumbnail:", e.message);
            switch (e.status) {
              case 413:
                alert(this.msg("thumb-error-413"));
                break;
              case 500:
              case 503:
                alert(this.msg("thumb-error-503"));
                break;
              default:
                alert(this.msg("thumb-error"));
                throw e;
            }
            return;
        }
        alert(this.msg("thumb-success"));
    }
}
