$(".postsignature").attr("id", function (i) {
  return "signature" + i;
});

$(".postsignature").prepend('<button class="expand">Expand</button >');

$(".expand").attr("id", function (i) {
  return "expand" + i;
});

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
