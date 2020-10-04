export default async function({addon, global, console}){
        var nav = document.querySelectorAll(".tabs")[0],
        tab = nav.appendChild(document.createElement("a"));
        tab.href = "/users/" + document.getElementById("frc-q-1088").value;
        tab.innerHTML = '<li><img class="tab-icon profile" width="40" height="24" src="//cdn2.scratch.mit.edu/get_image/gallery/default_170x100.png"><span>Profile</span></li>';
        void 0
}