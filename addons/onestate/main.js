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
    document.defaultView.addEventListener("beforeunload", function (event) {
        global.setOneState(false, "")
    })
    global.setOneState = async (online, rpc) => {
        return await fetch(`https://state.onedot.cf/api/v1/user/${user}`, {
            method: 'POST',
            mode: 'cors',
            cache: 'no-cache',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json'
            },
            redirect: 'follow',
            referrerPolicy: 'no-referrer',
            body: JSON.stringify({
                online: online,
                richpresense: rpc,
                retroid: token
            })
        });
    }
    global.getOneState = async (user) => {
        var data = fetch(`https://state.onedot.cf/api/v1/user/${user}`)
        return await data
    }
    while (true) {
        if (rpcon) {
            global.setOneState(true, ""/* todo: check url and make a string saying playing ... or something */)
        } else {
            global.setOneState(true, "")
        }
    }
}