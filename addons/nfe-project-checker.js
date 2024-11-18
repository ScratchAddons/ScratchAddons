function check() {
  if (document.querySelector("div.share-date") === null) {
    window.setTimeout(check, 50);
  } else {
    async function checkforNfe() {
      var data = await getStatus(
        window.location.href.split("/projects/")[1].split("/")[0]
      );
      var date = document.querySelector("div.share-date").lastChild;
      if (!date.className.includes("scratchaddons")) {
        if (data === "notreviewed") {
          date.textContent = `${date.textContent} · 🤔 Not Rated`;
          date.className = date.className + " scratchaddons";
        }
        if (data === "safe") {
          date.textContent = `${date.textContent} · ✅ Rated FE`;
          date.className = date.className + " scratchaddons";
        }
        if (data === "notsafe") {
          date.textContent = `${date.textContent} · ⛔ Rated NFE`;
          date.className = date.className + " scratchaddons";
        }
      }
    }
    checkforNfe();
  }
}
check();

async function getStatus(project) {
  var response = await fetch(
    "https://scratch.mit.edu/projects/" + project + "/remixtree/bare/"
  );
  var data = await response.json();
  return data[project].moderation_status;
}
