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
        global.setOneState(false, "", "")
    })
    global.setOneState = async (online, rpc, rpcurl) => {
        var data = {
            online: online,
            richpresense: rpc,
            richpresenseurl: rpcurl,
            retroid: token
        }
        var url = `https://state.onedot.cf/api/v1/user/${user}`
        var resp = await fetch(url, {
            method: 'POST',
            mode: 'cors',
            cache: 'no-cache',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json'
            },
            redirect: 'follow',
            referrerPolicy: 'no-referrer',
            body: JSON.stringify(data)
        });
        return await resp.json();
    }
    global.getOneState = async (user) => {
        var data = fetch(`https://state.onedot.cf/api/v1/user/${user}`)
        return await data
    }
    if (rpcon) {
        var path = document.defaultView.location.pathname
        var projectx = /\/projects\/.*/g
        var studiosx = /\/studios\/.*/g
        var discussx = /\/discuss\/.*/g
        if (projectx.test(path)) {
            if (path.includes('editor')) {
                global.setOneState(true, `Editing ${document.title}`, path);
            } else {
                global.setOneState(true, `Playing ${document.title}`, path);
            }
        } else if (studiosx.test(path)) {
            global.setOneState(true, `Looking at a ${document.title}`, path);
        } else if (discussx.test(path)) {
            if (path.includes('topic')) {
                global.setOneState(true, `Looking at ${document.title}`, path);
            } else if (path === '/discuss' || path === '/discuss/') {
                global.setOneState(true, `Looking at discussion forums`, path);
            } else {
                global.setOneState(true, `Looking at ${document.title}`, path);
            }
        }else{
            global.setOneState(true, "", path);
        }
    } else {
        global.setOneState(true, "", "")
    }
}