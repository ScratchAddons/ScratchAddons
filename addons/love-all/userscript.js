export default async function ({ addon, msg }) {
    var txt = document.URL;
    txt.split('#')[0]
    var numb = txt.match(/\d/g);
    numb = numb.join("");

    $.ajax({type: "PUT",url: "https://scratch.mit.edu/site-api/users/lovers/" + numb + "/add/"})

  }
