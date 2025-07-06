// ==UserScript==
// @name         VIGARPAST_777 Scratch Ad Manager with Quick Button
// @namespace    https://scratch.mit.edu/
// @version      2.9
// @description  Easily manage your project and studio ads with a quick access button on all Scratch pages except ad pages. Made by VIGARPAST_777.
// @match        https://scratch.mit.edu/*
// @grant        GM_xmlhttpRequest
// @connect      scratchadvertise-f787.restdb.io
// @downloadURL https://update.greasyfork.org/scripts/539736/VIGARPAST_777%20Scratch%20Ad%20Manager%20with%20Quick%20Button.user.js
// @updateURL https://update.greasyfork.org/scripts/539736/VIGARPAST_777%20Scratch%20Ad%20Manager%20with%20Quick%20Button.meta.js
// ==/UserScript==

(async function() {
    'use strict';


    const excludedPaths = ["/advertise", "/advertise-projects", "/advertise-studios"];
    const path = window.location.pathname;

    if (!excludedPaths.includes(path)) {
        const btn = document.createElement("a");
        btn.textContent = "Advertise Here";
        btn.href = "/advertise";
        btn.style.position = "fixed";
        btn.style.top = "10px";
        btn.style.left = "10px";
        btn.style.background = "#007bff";
        btn.style.color = "white";
        btn.style.padding = "8px 12px";
        btn.style.borderRadius = "6px";
        btn.style.fontWeight = "bold";
        btn.style.textDecoration = "none";
        btn.style.zIndex = "9999";
        btn.style.boxShadow = "0 2px 6px rgba(0,0,0,0.2)";
        btn.style.cursor = "pointer";
        document.body.appendChild(btn);
    }

    const API_SCRATCH_USER_PROJECTS = "https://api.scratch.mit.edu/users/VIGARPAST_777/projects";

    const encryptedKey = [
        99,100,54,51,97,97,101,55,102,48,56,53,53,55,98,52,
        100,102,98,48,50,51,53,52,99,97,51,48,48,101,57,97,
        99,102,102,48,100
    ];
    const API_KEY = encryptedKey.map(c => String.fromCharCode(c)).join('');
    const API_PROJECTS_URL = "https://scratchadvertise-f787.restdb.io/rest/projects";
    const API_STUDIOS_URL = "https://scratchadvertise-f787.restdb.io/rest/studios";

    const HEADERS = {
        "x-apikey": API_KEY,
        "Content-Type": "application/json"
    };

    async function addCredits() {
        const topBar = document.createElement("div");
        topBar.style.textAlign = "center";
        topBar.style.padding = "10px 0";
        topBar.style.fontWeight = "bold";
        topBar.style.fontSize = "18px";
        topBar.innerHTML = `
            Made By <a href="https://scratch.mit.edu/users/VIGARPAST_777/" target="_blank" style="color:#007bff;">VIGARPAST_777</a>
        `;

        const profileDiv = document.createElement("div");
        profileDiv.style.textAlign = "center";
        profileDiv.style.padding = "10px 0";

        const img = document.createElement("img");
        img.src = "https://uploads.scratch.mit.edu/users/avatars/69475709.png";
        img.style.width = "80px";
        img.style.height = "80px";
        img.style.borderRadius = "50%";
        img.style.boxShadow = "0 0 8px rgba(0,0,0,0.2)";
        img.alt = "Profile picture";

        const followText = document.createElement("div");
        followText.textContent = "Don’t forget to follow me!";
        followText.style.marginTop = "8px";
        followText.style.fontSize = "16px";

        profileDiv.appendChild(img);
        profileDiv.appendChild(followText);

        const projectsDiv = document.createElement("div");
        projectsDiv.style.maxWidth = "900px";
        projectsDiv.style.margin = "10px auto";
        projectsDiv.style.textAlign = "left";

        topBar.appendChild(profileDiv);
        topBar.appendChild(projectsDiv);

        document.body.prepend(topBar);

        try {
            const resp = await fetch(API_SCRATCH_USER_PROJECTS);
            if (!resp.ok) throw "Failed to fetch projects";
            const projects = await resp.json();

            const lastFive = projects
                .filter(p => p.public === true)
                .sort((a,b) => new Date(b.history.modified) - new Date(a.history.modified))
                .slice(0,3);

            const projHtml = lastFive.map(p => {
                return `
                    <div style="display:flex; align-items:center; gap:10px; margin-bottom:8px;">
                        <a href="https://scratch.mit.edu/projects/${p.id}" target="_blank" style="display:flex; align-items:center; text-decoration:none; color:#000;">
                            <img src="https://uploads.scratch.mit.edu/projects/thumbnails/${p.id}.png" alt="${p.title}" style="float:left; width:80px; height:60px; object-fit:cover; border-radius:6px; box-shadow:0 0 4px rgba(0,0,0,0.15);">
                            <span style="margin-left:10px; font-weight:600;">${p.title}</span>
                        </a>
                    </div>
                `;
            }).join("");

            projectsDiv.innerHTML = `<h3>My Latest Projects</h3>` + projHtml;

        } catch(e) {
            projectsDiv.innerHTML = "<em>Could not load projects.</em>";
        }
    }

    if (excludedPaths.includes(path)) {
        if (path === "/advertise") {
            if (!sessionStorage.getItem("adScriptDisclaimerShown")) {
                setTimeout(() => {
                    alert("This script is not affiliated with Scratch. Please be sure to follow all community rules and not use this tool for spam or mass promotion.");
                }, 0);
                sessionStorage.setItem("adScriptDisclaimerShown", "true");
            }

            document.body.innerHTML = `
                <style>
                    body { font-family: sans-serif; background:#f5f5f5; height:100vh; margin:0;
                           display:flex; justify-content:center; align-items:center; flex-direction:column; }
                    #box { background:white; padding:30px; border-radius:8px; text-align:center;
                           box-shadow:0 4px 8px rgba(0,0,0,0.1); }
                    select, button { font-size:18px; padding:10px; margin: 10px 0; }
                    a.button { text-decoration: none; background: #ccc; padding: 10px 20px; border-radius: 6px; display: inline-block; }
                </style>
                <div id="box">
                    <h2>What would you like to advertise?</h2>
                    <select id="sel">
                        <option disabled selected>Select...</option>
                        <option value="projects">🚀 Projects</option>
                        <option value="studios">🎬 Studios</option>
                    </select><br>
                    <a href="https://scratch.mit.edu" class="button">← Back to Scratch</a>
                </div>
            `;
            document.getElementById("sel").addEventListener("change", e => {
                window.location.href = e.target.value === "projects"
                    ? "/advertise-projects"
                    : "/advertise-studios";
            });
            await addCredits();
            return;
        }

        const isProjects = path === "/advertise-projects";
        const apiURL = isProjects ? API_PROJECTS_URL : API_STUDIOS_URL;
        const label = isProjects ? "Project" : "Studio";

        document.body.innerHTML = `
            <style>
                body { font-family: sans-serif; background:#f0f0f0; margin:20px; }
                .box { background:white; padding:20px; border-radius:8px; max-width:900px;
                       margin:auto; box-shadow:0 3px 6px rgba(0,0,0,0.1); }
                input, button {
                    width:100%; padding:12px; margin-top:10px;
                    font-size:16px; border-radius:6px; border:1px solid #ccc;
                }
                button { background:#007bff; color:white; border:none; cursor:pointer; }
                button:disabled { background:#aaa; cursor:default }
                .item {
                    display:flex; gap:12px; margin-top:15px;
                    padding:10px; background:#fafafa; border-radius:6px;
                    align-items: flex-start;
                    word-wrap: break-word;
                }
                .item img {
                    width:100px; height:75px; object-fit:cover; border-radius:4px;
                    flex-shrink: 0;
                }
                .item .info {
                    flex: 1;
                    overflow-wrap: break-word;
                    word-break: break-word;
                    font-size: 14px;
                    line-height: 1.4;
                }
                .top-links {
                    display: flex; justify-content: space-between; margin-bottom: 10px;
                }
                .top-links a {
                    background: #ddd; padding: 8px 16px;
                    text-decoration: none; border-radius: 5px;
                    font-size: 14px;
                }
            </style>
            <div class="box">
                <div class="top-links">
                    <a href="/advertise">← Change type</a>
                    <a href="https://scratch.mit.edu">← Back to Scratch</a>
                </div>
                <h2>Submit a ${label}</h2>
                <input type="text" id="inpId" placeholder="Enter ${label} ID">
                <button id="btn">Submit</button>
                <div id="list"><em>Loading ${label.toLowerCase()}s...</em></div>
            </div>
        `;

        function req(method, url, data) {
            return new Promise((res, rej) => {
                GM_xmlhttpRequest({
                    method, url, headers: HEADERS,
                    data: data ? JSON.stringify(data) : null,
                    onload: r => r.status >= 200 && r.status < 300 ? res(r.responseText) : rej(r),
                    onerror: rej
                });
            });
        }

        async function loadList() {
            const txt = await req("GET", apiURL);
            const arr = JSON.parse(txt).sort((a,b)=> new Date(b.date)-new Date(a.date));
            const html = arr.map(o => {
                const id = isProjects ? o.projectId : o.studioId;
                const usr = isProjects ? o.author : (o.curator || "unknown");
                const image = isProjects
                    ? `https://uploads.scratch.mit.edu/projects/thumbnails/${id}.png`
                    : `https://cdn2.scratch.mit.edu/get_image/gallery/${id}_170x100.png`;
                return `
                    <div class="item">
                        <img src="${image}" onerror="this.src='https://upload.wikimedia.org/wikipedia/commons/6/65/No-Image-Placeholder.svg'">
                        <div class="info">
                            <strong>${o.title}</strong><br>
                            👤 ${usr}<br>
                            📅 ${new Date(o.date).toLocaleString()}<br>
                            <a href="https://scratch.mit.edu/${isProjects ? 'projects' : 'studios'}/${id}" target="_blank">View on Scratch</a>
                        </div>
                    </div>`;
            }).join("");
            document.getElementById("list").innerHTML = `
                <h3>Total ${label}s: ${arr.length}</h3>
                ${html || `<em>No ${label.toLowerCase()}s yet.</em>`}
            `;
        }

        document.getElementById("btn").addEventListener("click", async ()=>{
            const val = document.getElementById("inpId").value.trim();
            if (!/^\d+$/.test(val)) { alert("Invalid ID."); return; }
            document.getElementById("btn").disabled = true;
            try {
                const apiEnt = isProjects ? `projects/${val}` : `studios/${val}`;
                const resp = await fetch(`https://api.scratch.mit.edu/${apiEnt}`);
                if (!resp.ok) throw "Invalid ID";
                const dat = await resp.json();

                const existTxt = await req("GET", apiURL);
                const existArr = JSON.parse(existTxt);
                const exists = existArr.find(e =>
                    isProjects ? e.projectId == val : e.studioId == val
                );
                if (exists) {
                    await req("PATCH", `${apiURL}/${exists._id}`, {date: new Date().toISOString()});
                    alert("Date updated.");
                } else {
                    const payload = isProjects
                        ? { projectId: dat.id, title: dat.title, author: dat.author.username, date: new Date().toISOString() }
                        : { studioId: dat.id, title: dat.title, curator: dat.curator?.username || "unknown", date: new Date().toISOString() };
                    await req("POST", apiURL, payload);
                    alert("Saved.");
                }
                document.getElementById("inpId").value = "";
                loadList();
            } catch(e) {
                alert(e);
            } finally {
                document.getElementById("btn").disabled = false;
            }
        });

        await loadList();
        await addCredits();
        return;
    }

})();

