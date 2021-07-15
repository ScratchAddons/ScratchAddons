export default async function ({ addon, global, console }) {

// Select all "h1" tags
var h1s = document.getElementsByTagName("h1");
for(var i=0, l=h1s.length; i<l; i++) {
// Set the "h1" text to "Scratch"
h1s[i].innerText = "Scratch";
}

// Select all "h2" tags
var h2s = document.getElementsByTagName("h2");
for(var i=0, l=h2s.length; i<l; i++) {
// Set the "h2" text to "Scratch"
h2s[i].innerText = "Scratch";
}

// Select all "h3" tags
var h3s = document.getElementsByTagName("h3");
for(var i=0, l=h3s.length; i<l; i++) {
// Set the "h3" text to "Scratch"
h3s[i].innerText = "Scratch";
}

// Select all "h4" tags
var h4s = document.getElementsByTagName("h4");
for(var i=0, l=h4s.length; i<l; i++) {
// Set the "h4" text to "Scratch"
h4s[i].innerText = "Scratch";
}

// Select all "h5" tags
var h5s = document.getElementsByTagName("h5");
for(var i=0, l=h5s.length; i<l; i++) {
// Set the "h5" text to "Scratch"
h5s[i].innerText = "Scratch";
}

// Select all "h6" tags
var h6s = document.getElementsByTagName("h6");
for(var i=0, l=h6s.length; i<l; i++) {
// Set the "h6" text to "Scratch"
h6s[i].innerText = "Scratch";
}

// Select all "p" tags
var ps = document.getElementsByTagName("p");
for(var i=0, l=ps.length; i<l; i++) {
// Set the "p" text to "Scratch"
ps[i].innerText = "Scratch";
}

// Select all "img" tags
var imgs = document.getElementsByTagName("img");
for(var i=0, l=imgs.length; i<l; i++) {
// Set all of the images to Scratch
imgs[i].src = "https://scratch.mit.edu/favicon.ico";
}

// Select all "span" tags
var spans = document.getElementsByTagName("span");
for(var i=0, l=spans.length; i<l; i++) {
// Set the "span" text to "Scratch"
spans[i].innerText = "Scratch";
}

}
