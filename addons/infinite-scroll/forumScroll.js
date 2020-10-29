export default async function ({ addon, global, console }) {
  if (window.location.pathname.split("/").length == 4) {
    for (let show of document.getElementsByClassName("pagination")) show.style.display = "none";
    let page = 1;
    let lock = false;
    window.addEventListener("scroll", () => {
      if (
        window.scrollY + window.innerHeight >=
        document.getElementById("djangobbindex").offsetHeight - document.getElementById("footer").offsetHeight
      ) {
        if (!lock) {
          lock = true;
          page++;
          let nextPage;
          if (location.search) {
            let search = location.search.replace(/(&|\?)page=[0-9]+/, "");
            nextPage = `https://scratch.mit.edu${location.pathname}${search}&page=${page}`;
          } else {
            nextPage = `https://scratch.mit.edu${location.pathname}?page=${page}`;
          }
          window
            .fetch(nextPage)
            .catch((err) => {
              console.log("Unable to fetch the page!");
            })
            .then((res) => res.text())
            .then((data) => {
              let parser = new DOMParser();
              let doc = parser.parseFromString(data, "text/html");
              let table, posts;
              let vf = document.getElementById("vf");
              if (vf) {
                table = vf.getElementsByTagName("tbody")[0];
                posts = doc.getElementById("vf").getElementsByTagName("tr");
              } else {
                table = document.getElementById("djangobbindex");
                posts = doc.getElementById("djangobbindex").getElementsByClassName("blockpost");
              }
              for (let i = 1; i < posts.length; i++) {
                if (vf) {
                  table.appendChild(posts[i]);
                } else {
                  table.insertBefore(posts[i], table.querySelector(".postlinksb"));
                }
              }
              lock = false;
            });
        }
      }
    });
  }
}
