export default async function ({ addon, console, msg }) {
  // Present on forum pages with tbody. Used as a switch to
  // query for table and posts, and determine append/insert location.
  let vf = document.getElementById("vf");

  let pageSeparator, pageSeparatorTd;
  if (vf) {
    pageSeparator = document.createElement("tr");
    pageSeparatorTd = document.createElement("th");
    pageSeparatorTd.className = "tcl";
    pageSeparatorTd.scope = "col";
    pageSeparatorTd.colSpan = 4;
    pageSeparator.appendChild(pageSeparatorTd);
  }

  let page = 1;
  let lock = false;

  const update = () => {
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
            if (vf) {
              table = vf.getElementsByTagName("tbody")[0];
              posts = doc.getElementById("vf").getElementsByTagName("tr");
              pageSeparatorTd.textContent = msg("page-num", { page });
              table.appendChild(pageSeparator.cloneNode(true));
            } else {
              table = document.getElementById("djangobbindex");
              posts = doc.getElementById("djangobbindex").getElementsByClassName("blockpost");
            }
            // Use an array to iterate, since elements are removed from the live HTMLCollection
            // 'posts' each time an element is detached during appendChild/insertBefore
            const postArray = Array.from(posts);
            // Element 0 is the table header. Skip it with i = 1
            for (let i = 1; i < postArray.length; i++) {
              if (vf) {
                table.appendChild(postArray[i]);
              } else {
                let insertionPoint = table.querySelector(".linksb");
                if (!insertionPoint) {
                  insertionPoint = table.querySelector(".postlinksb");
                }
                table.insertBefore(postArray[i], insertionPoint);
              }
            }
            lock = false;
          });
      }
    }
  };

  window.addEventListener("scroll", () => update(), { passive: true });
  update();
}
