export default async function ({ addon, global, console, setTimeout, setInterval, clearTimeout, clearInterval }) {
  // defresh start
  var d = document, // define d as document,
    x, // x as null (soon to be xmlhttp request and link before query)
    m, // m as null (soon to be selected link)
    l = d.links, // l as d(document).links,
    p = {}, // p as empty object (used for key-press determination),
    w = window, // w as window,
    h = w.history, // h as w(window).history,
    z = w.location; // and defreshUnload as null
  w.onkeydown = function (e) {
    // when a key is pressed
    p[e.key] = true; // add that key to the p variable as true
  }; // end key-press function
  w.onkeyup = function (e) {
    // when a key is lifted
    p[e.key] = undefined; // make the variable undefined
  }; // end key-lift function
  function defresh(r, a) {
    // define function defresh()
    if (w.XMLHttpRequest && h) {
      // if xml and history are supported
      x = new XMLHttpRequest(); // make x into xmlhttp request
    }
    if (!w.XMLHttpRequest || !h) {
      // if one of them is not supported
      e();
    } // end if statement
    x.onload = function () {
      // when x is loaded
      if ("scrollRestoration" in h) {
        // if history scroll restoration supported
        h.scrollRestoration = "manual"; // scroll restoration on
      } // end if statement
      if (a == "push") {
        // if the method is push
        h.pushState({ page: r, path: r }, "", r); // history.pushState the link
        w.scrollTo(0, 0); // scroll to top
      } // end if statement
      if (a == "replace") {
        // if the method is replace
        h.replaceState({ page: r, path: r }, "", r); // history.replaceState the link
        w.scrollTo(0, 0); // scroll to top
      } // end if statement
      d.open("text/html"); // clear document
      d.write(this.responseText); // write data
      d.close(); // close document
    }; // end function
    x.open("GET", r, true); // send link
    x.send(null); // send xmlhttp request
    function e() {
      // define error function
      if (a == "replace") {
        // if the method is replace
        z.replace(r); // backup replace
      }
      if (a != "replace") {
        // otherwise
        z.href = r; // push to site
      } // end if statement
    } // end function
  } // end function
  function defreshLinks() {
    // setInterval of function (interval is for updated links)
    for (var i = 0; i < l.length; i++) {
      // cycle through all the links using a variable named i
      m = l[i]; // set m as the (i)th link
      x = m.href.split("/?")[0].split("/#")[0].split("?")[0].split("#")[0]; // set x as m's link before querys or hashes
      if (
        // if... (brace yourself!)
        (m.href != null && // there is a link and
          m.onclick == null && // and there is no onclick to the link and
          m.hostname.includes("scratch.mit.edu") && // the link is on the same site
          m.protocol == z.protocol && // protocol (http vs https) is same
          m.target != "_blank" && // the link is on the same tab and
          m.target != "_parent" && // the link is not on the parent tab and
          !x.endsWith(".js") && // it is not a js file and
          !x.endsWith(".json") && // it is not a json file and
          !x.endsWith(".css") && // it is not a css file and
          !x.endsWith(".txt") && // it is not a txt file and
          !x.endsWith(".xml") && // it is not a xml file and
          !m.hasAttribute("download") && // it is not a download link and
          !m.hasAttribute("data-no-defresh")) || // it does not have the "no-defresh" attribute OR
        m.hasAttribute("data-do-defresh") // has the "do-defresh" attribute
      ) {
        // then
        m.onclick = function (e) {
          // when you click the link:
          if (
            // check if... (brace yourself again!)
            p["Control"] != true && // the control/ctrl key is not down and
            p["Shift"] != true && // the shift key is not down and
            p["Meta"] != true // the mac command key is not down
          ) {
            // then
            e.preventDefault(); // stop the link and
            defresh(this.href, "push"); // defresh instead
          } // end if statement
        }; // end function
      } // end if statement
    } // end cycle
  } // end function
  defreshLinks(); // defresh links to get rid of initial delay
  window.setInterval(defreshLinks, 1000); // keep doing it every second
  w.addEventListener("popstate", function () {
    // when back or forward is pressed
    defresh(z.pathname, "none"); // update page
  }); // end function
  // defresh end
}
