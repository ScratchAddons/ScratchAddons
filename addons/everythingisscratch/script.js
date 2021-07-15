export default async function ({ addon, global, console }) {

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
