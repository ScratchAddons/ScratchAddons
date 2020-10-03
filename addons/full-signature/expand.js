// Add id to each signature
$(".postsignature").attr("id", function (i) {
  return "signature" + i;
});

// Add P element to each postsignature. The content is Expand Signature ▼
$(".postsignature").prepend(
  '<p style="cursor:pointer; color: #4d97ff; font-weight: bold;" class="expand">Expand Signature ▼</p>'
);

// Add id to each expand element
$(".expand").attr("id", function (i) {
  return "expand" + i;
});

// When the expand element is clicked, it gets it's id, removes the expand bit from it.
// Then, it adds a style element, that uses the id and adds it to the signature and the style. This expands it.
// Todo: Work on being able to close signature.
$(".expand").click(function () {
  var id = this.id.replace("expand", "");
  var styles = "#signature" + id + "{max-height:fit-content!important;}";
  var newstyle = document.createTextNode(styles);
  var head, style;
  head = document.getElementsByTagName("head")[0];
  if (!head) {
    return;
  }
  style = document.createElement("style");
  style.appendChild(newstyle);
  head.appendChild(style);
});
