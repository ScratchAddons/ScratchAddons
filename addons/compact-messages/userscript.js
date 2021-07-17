export default async function ({ addon, global, console }) {

// Loop the code, just in case something funky happens
setInterval(function(){

// select all of the icons
var icons = document.getElementsByClassName('social-message-icon');
// for each icon, execute
for(var i = 0; i < icons.length; i++){
  // remove the friken icon
    icons[i].remove();
}

// select all of the messages
var messages = document.getElementsByClassName('social-message');
// for each message, execute
for(var i = 0; i < messages.length; i++){
  // Make the messages smaller
    messages[i].style.padding = '10px';
}

// select all of the messages that contain comments
var comments = document.getElementsByClassName('comment-text');
// for each comment box, execute
for(var i = 0; i < comments.length; i++){
  // Make the comment box smaller
    comments[i].style.padding = '5px';
}
}, 10)

}
