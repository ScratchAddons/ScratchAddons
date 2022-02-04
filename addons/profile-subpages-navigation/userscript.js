var links = [
  {
    title: "Projects",
    href: "/projects/",
  },
  {
    title: "Favorites",
    href: "/favorites/",
  },
  {
    title: "Studios Curating",
    href: "/studios/",
  },
  {
    title: "Studios Following",
    href: "/studios_following/",
  },
  {
    title: "Following",
    href: "/following/",
  },
  {
    title: "Followers",
    href: "/followers/",
  },
];
var div = document.querySelector("div.box-head");
var user = div.querySelector("h2").querySelector("a").innerHTML;
var ul = document.createElement("ul");
ul.setAttribute("class", "navprofile");
ul.setAttribute("style", "list-style:none;");
for (var x in links) {
  var li = document.createElement("li"),
    a = document.createElement("a");
  li.setAttribute("style", "display:inline;margin:12px;");
  a.setAttribute("href", "https://scratch.mit.edu/users/" + user + links[x].href);
  a.innerHTML = links[x].title;
  li.appendChild(a);
  ul.appendChild(li);
}
div.appendChild(ul);
