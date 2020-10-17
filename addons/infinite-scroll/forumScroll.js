export default async function ({ addon, global, console }) {
  if (window.location.pathname.split("/").length == 4) {
    for (let show of document.getElementsByClassName("pagination")) show.style.display = "none";
    let page = 1;
    let lock = false;
    window.onscroll = function (ev) {
      if (
        window.scrollY + window.innerHeight >=
        document.getElementById("djangobbindex").offsetHeight - document.getElementById("footer").offsetHeight
      ) {
        if (!lock) {
          lock = true;
          page++;
          window
            .fetch(`https://scratch.mit.edu${document.location.pathname}?page=${page}`)
            .catch((err) => {
              console.log("Unable to fetch the page!");
            })
            .then((res) => res.text())
            .then((data) => {
              let parser = new DOMParser();
              let doc = parser.parseFromString(data, "text/html");
              let table = document.getElementById("vf").getElementsByTagName("tbody")[0];
              let posts = doc.getElementById("vf").getElementsByTagName("tr");
              for (let i = 1; i < posts.length; i++) {
                let row = table.insertRow(-1);
                row.innerHTML = posts[i].innerHTML;
              }
              lock = false;
            });
        }
      }
    };
  }
}
