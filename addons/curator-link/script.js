export default async function () {
  var oldh4 = document.querySelector(".inner:last-of-type h4");
  var curator = oldh4.textContent.split(" ")[3];

  var newh4 = document.createElement("h4");
  newh4.textContent = "Projects Curated by ";

  var link = document.createElement("a");
  link.textContent = curator;
  link.href = `https://scratch.mit.edu/users/${curator}`;
  link.id = "curator-link";
  newh4.appendChild(link);

  oldh4.replaceWith(newh4);
}
