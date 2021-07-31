export default async function ({ addon, global, console }) {
// define the user's username header
let usernameheader = document.getElementsByClassName("header-text")[0].firstElementChild

let userid = document.createElement("font");
userid.style.color = "lightgrey"
userid.style.size = 2;

// fetch the user's id by making a get request to api.scratch.mit.edu
// location.pathname returns /users/USERNAME/
fetch('https://api.scratch.mit.edu' + location.pathname)
  .then(response => response.json())
  // Add the ID of the response to the username header
  .then(data => userid.textContent = "#" + data.id);

// add the id next to the header
usernameheader.appendChild(userid);
}
