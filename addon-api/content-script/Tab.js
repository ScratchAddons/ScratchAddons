export default class Tab {
    constructor() {
        this.clientVersion = document.querySelector("#app #navigation") ? "scratch-www" : window.Scratch ? "scratchr2" : null;
    }

}  