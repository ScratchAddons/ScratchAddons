export default async function({addon, global, console}){
  //Select where the new tab will be appended, and create a new tab
  var nav = document.querySelectorAll(".tabs")[0],
  tab = nav.appendChild(document.createElement("a")),
  li = tab.appendChild(document.createElement("li")),
  img = li.appendChild(document.createElement("img")),
  span = li.appendChild(document.createElement("span"));
  
  //Link to the profile
  tab.href = "/users/" + document.getElementById("frc-q-1088").value;

  //Set up the image. May be changed in the future to a different icon, preferably an SVG if found.
  img.src = "//cdn2.scratch.mit.edu/get_image/gallery/default_170x100.png";
  img.width = 40;
  img.height = 24;
  img.className = "tab-icon";

  //Add the text below the image
  span.innerText = "Profile";
}
