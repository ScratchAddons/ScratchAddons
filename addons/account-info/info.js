
export default async function ({ addon, console, msg }) {
    
    let username;
    let api_userInfo;
    let userInfo;
    try {
        username = await addon.auth.fetchUsername()
        api_userInfo = await (await fetch(`https://api.scratch.mit.edu/users/${username}`)).json();
        userInfo = await (await fetch("https://scratch.mit.edu/session/", {
            "headers": {
              "accept": "*/*",
              "sec-fetch-dest": "empty",
              "sec-fetch-mode": "cors",
              "sec-fetch-site": "same-origin",
              "x-requested-with": "XMLHttpRequest"
            },
            "referrer": "https://scratch.mit.edu/session/",
            "referrerPolicy": "strict-origin-when-cross-origin",
            "body": null,
            "method": "GET",
            "mode": "cors",
            "credentials": "include"
          })).json()
    } catch (error) {
        console.log(error);
    }

    // console.log("Adding info button");
    let li = document.querySelector(".tabs-index ul").children[2].cloneNode(true);
    li.classList.remove("active");
    li.classList.add("info")
    // console.log(li)
    let a = li.querySelector("a")
    a.innerText = msg("Info")
    a.href = "https://scratch.mit.edu/accounts/settings/#info"
    a.onclick = () => {
        if (document.URL != "https://scratch.mit.edu/accounts/settings/#info") {
            info()
        }
    }

    li.appendChild(a)
    document.querySelector(".tabs-index").children[0].appendChild(li)
    // console.log("Added info button");

    if (document.URL == "https://scratch.mit.edu/accounts/settings/#info") {
        info()
    }
    function createlabel(...content) {
        let rem = document.createElement("div")
        rem.classList.add("field-wrapper")
        for (let i = 0; i < content.length; i++) {
            rem.appendChild(content[i])
        }
        return rem

    }
    function loadImage(_url) {
        let img;
        new Promise((resolve) => {
            img = new Image();
            img.onload = () => resolve(img);
            img.src = _url
        });
        return img
    }

    
    async function info() {
        // console.log("Changing page to accont info");
        let element = document.getElementsByClassName("first active")[0]
        element.classList.remove("active")
        document.querySelector(".info").classList.add("active")
        
        document.querySelector(".box-head h2").innerText = msg("Account Information")
        let main = document.querySelector("#main-content").children
        main[0].innerText = msg("Information")
        main[3].remove()
        
        let rem_a;
        let rem_b;
        let rem_c;
        let rem_d;
        
        function autoCreateBool(label, value) {    
            rem_a = document.createElement("label")
            rem_a.innerText = msg(label)
            rem_b = document.createElement("span")
            if(value){
                rem_b.innerText = msg("Yes")
            }
            else{
                rem_b.innerText = msg("No")
            }
            content.appendChild(createlabel(rem_a, rem_b))
        }
        function br(){
            content.appendChild(document.createElement("br"))
        }

        let content_children = main[2].children
        let content = main[2]
        content_children[3].remove()
        content_children[2].remove()
        content_children[1].remove()
        
        rem_a = document.createElement("label")
        rem_a.innerText = msg("Username")
        rem_b = document.createElement("span")
        rem_b.innerText = userInfo.user.username
        content.appendChild(createlabel(rem_a, rem_b))
        // console.log(content_children)

        br()

        rem_a = document.createElement("label")
        rem_a.innerText = msg("Profile Picture")
        rem_b = document.createElement("span")
        rem_b.appendChild(await loadImage(`https://uploads.scratch.mit.edu/get_image/user/${await addon.auth.fetchUserId()}_100x100.png`))
        rem_c = document.createElement("br")
        rem_d = document.createElement("a")
        rem_d.innerText = `https://uploads.scratch.mit.edu/get_image/user/${await addon.auth.fetchUserId()}_100x100.png`
        content.appendChild(createlabel(rem_a, rem_b, rem_c, rem_d))
        // console.log(content_children)

        br()

        rem_a = document.createElement("label")
        rem_a.innerText = msg("Location")
        rem_b = document.createElement("span")
        rem_b.innerText = api_userInfo.profile.country
        content.appendChild(createlabel(rem_a, rem_b))
        // console.log(content_children)

        br()

        rem_a = document.createElement("label")
        rem_a.innerText = msg("Joined")
        rem_b = document.createElement("span")
        rem_b.innerText = userInfo.user.dateJoined
        content.appendChild(createlabel(rem_a, rem_b))
        // console.log(content_children)

        br()

        rem_a = document.createElement("label")
        rem_a.innerText = msg("Id")
        rem_b = document.createElement("span")
        rem_b.innerText = userInfo.user.id
        content.appendChild(createlabel(rem_a, rem_b))
        // console.log(content_children)

        br()

        rem_a = document.createElement("label")
        rem_a.innerText = msg("Email")
        rem_b = document.createElement("span")
        rem_b.innerText = userInfo.user.email
        rem_b.classList.add("current-email")
        if(userInfo.flags.confirm_email_banner) {
            rem_b.classList.add("confirmed")
        }
        content.appendChild(createlabel(rem_a, rem_b))
        // console.log(content_children)

        br()

        rem_a = document.createElement("label")
        rem_a.innerText = msg("Token")
        rem_b = document.createElement("span")
        rem_b.innerText = userInfo.user.token
        content.appendChild(createlabel(rem_a, rem_b))
        // console.log(content_children)

        br()

        rem_a = document.createElement("label")
        rem_a.innerText = msg("Bio")
        rem_b = document.createElement("span")
        rem_b.innerText = api_userInfo.profile.bio
        content.appendChild(createlabel(rem_a, rem_b))
        // console.log(content_children)

        br()
        
        rem_a = document.createElement("label")
        rem_a.innerText = msg("Status")
        rem_b = document.createElement("span")
        rem_b.innerText = api_userInfo.profile.status
        content.appendChild(createlabel(rem_a, rem_b))
        // console.log(content_children)
        
        br()
        
        autoCreateBool("Banned?", userInfo.user.banned)
        autoCreateBool("Muted?", !(userInfo.permissions.mute_status.muteExpiresAt == undefined))
        autoCreateBool("Admin?", userInfo.permissions.admin)
        autoCreateBool("Educator?", userInfo.permissions.educator)
        autoCreateBool("New Scratcher?", userInfo.permissions.new_scratcher)
        autoCreateBool("Scratcher?", userInfo.permissions.scratcher)
        autoCreateBool("Social?", userInfo.permissions.social)
        autoCreateBool("Student?", userInfo.permissions.student)

        // console.log(userInfo)
        // console.log(addon)
        // console.log(userInfo)


        // console.log("Changed page to accont info");
    }
}