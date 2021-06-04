export default async function ({ addon, global, console }) {
    var token = addon.settings.get("token")
    addon.settings.addEventListener("change", () => {
        token = addon.settings.get("token")
    });
    var user = addon.auth.username
    addon.auth.addEventListener("change", function () {
        user = addon.auth.username
    });
    var rpcon = addon.settings.get("rpc")
    addon.settings.addEventListener("change", () => {
        rpcon = addon.settings.get("rpc")
    });
    global.setOneState = (online, rpc) => {
        // todo: send online and rpc to server
    }
    global.getOneState = (user) => {
        // todo: get online and rpc from server
    }
    while (true) {
        if (rpcon) {
            global.setOneState(true,/* todo: check url and make a string saying playing ... or something */)
        } else {
            global.setOneState(true, "")
        }
    }
    // todo: check if window closed and set offline using `global.setOneState(false, "")`
}