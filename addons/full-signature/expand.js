export default async function ({ addon, global, console }) {
  // Add id to each signature
  $(".postsignature").attr("id", function (i) {
    return "signature" + i;
  });

  // Add P element to each postsignature. The content is Expand Signature ▼
  $(".postsignature").prepend(
    '<p data-expand="0" style="cursor:pointer; color: #4d97ff; font-weight: bold;" class="expand">Expand Signature ▽</p>'
  );

  // Add id to each expand element
  $(".expand").attr("id", function (i) {
    return "expand" + i;
  });

  // When the expand element is clicked, it gets it's id, removes the expand bit from it.
  // Then, it adds a style element, that uses the id and adds it to the signature and the style. This expands it.

  $(".expand").click(function () {
    var id = this.id.replace("expand", "");
    var fullid = this.id;
    if ($("#signature" + id).data("expand") == "0") {
      $("#signature" + id).attr("style", "max-height:fit-content!important");
      $("#" + fullid).text("Close Signature △");
      $("#signature" + id).data("expand", "1");
    } else {
      var newid = this.id.replace("expand", "");
      $("#signature" + id).attr("style", "");
      $("#signature" + id).data("expand", "0");
      $("#" + fullid).text("Expand Signature ▽");
    }
  });
}
