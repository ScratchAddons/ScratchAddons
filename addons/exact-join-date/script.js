var join_date = `${document.querySelector(".profile-details span:nth-child(2)").title}`;
let join_date_parts = join_date.split("-");
let months = ["January", "Febuary", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
var join_date_improved = months[Number(join_date_parts[1]) - 1] + " " + Number(join_date_parts[2]) + ", " + Number(join_date_parts[0]);
let details = document.querySelector(".profile-details");
details.innerHTML = details.innerHTML.replace("ago", "");
document.querySelector(".profile-details span:nth-child(2)").title = document.querySelector(".profile-details span:nth-child(2)").innerHTML.replace(/&nbsp;/g, " ") + " ago";
document.querySelector(".profile-details span:nth-child(2)").innerHTML = join_date_improved;
