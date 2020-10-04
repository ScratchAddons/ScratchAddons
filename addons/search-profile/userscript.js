export default async function({addon, global, console}){
  //Select where the new tab will be appended, and create a new tab
  var nav = document.querySelectorAll(".tabs")[0],
  tab = nav.appendChild(document.createElement("a"));

  //Have it link to the profile, or link to a 404 page if it doesn't exist
  tab.href = "/users/" + document.getElementById("frc-q-1088").value;

  //Create the actual tab stuff. I just reused an icon used for a blank studio. For some reason it looks weird without setting the width and height but it doesn't seem to change much in reality.
  tab.innerHTML = '<li><img class="tab-icon" width="40" height="24" src="//cdn2.scratch.mit.edu/get_image/gallery/default_170x100.png"><span>Profile</span></li>';

  //Prevent the webpage from erasing itself because you just edited the innerHTML of an element
  void 0
}
