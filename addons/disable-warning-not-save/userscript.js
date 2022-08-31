export default async function ({ addon, global, console }) {
  setTimeout( function() {
    document.body.onbeforeunload = function(){};
  }, 500 );
}