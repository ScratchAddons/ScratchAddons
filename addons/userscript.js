// Create the box and append its children
let boxdivtop = document.createElement("div");
boxdivtop.className = "box";
let boxdivthird = document.createElement("div");
boxdivthird.className = "box-content";
let boxdivsecond = document.createElement("div");
boxdivsecond.className = "box-header";
boxdivtop.appendChild(boxdivsecond);
boxdivtop.appendChild(boxdivthird);

// Add title to the box header
let boxtitle = document.createElement("h4");
boxtitle.innerText = "Featured Users";
boxdivsecond.appendChild(boxtitle);

// Creade a slider for the user list
let slickslidertop = document.createElement("div");
slickslidertop.className = "slick-initialized slick-slider carousel";
boxdivthird.appendChild(slickslidertop);
let slicklist = document.createElement("div");
slicklist.className = "slick-list";
slickslidertop.appendChild(slicklist);
slicktrack = document.createElement("div");
slicktrack.className = "slick-track";
slicktrack.style.opacity = 1;
slicktrack.style.transform = "translate3d(0px, 0px, 0px)";
slicktrack.style.width = "2925px";
slicklist.append(slicktrack)

// Fetch lanky's database & create elements for featured users
var raw;
await fetch('https://www.scratch-featured-users.tk/json')
    .then(response => response.json())
    .then(data => raw = data)

// Loop through the database & append elements
for (var key in raw){
let usertop = document.createElement("div");
usertop.className = "thumbnail gallery slick-slide slick-active";
usertop.style.paddingLeft = "7px";
usertop.style.paddingRight = "7px";
let usersecond = document.createElement("a");
usersecond.className = "thumbnail-image";
usersecond.href = "https://scratch.mit.edu/users/" + raw[key].username + "/";
let userprofilepic = document.createElement("img");
userprofilepic.style.width = "100px"
userprofilepic.src = "https://cdn2.scratch.mit.edu/get_image/user/" + raw[key].id + "_60x60.png";
usersecond.append(userprofilepic)
let userprofilelink = document.createElement("a");
userprofilelink.innerText = raw[key].username;
usersecond.append(userprofilelink)
usertop.append(usersecond)
slicktrack.append(usertop)
}

// Append everything to the splash section list
document.getElementsByClassName("mod-splash")[0].append(boxdivtop);
