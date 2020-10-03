// For every post with a signature line, add an id, and create expand button
$(".box-content").each(function(index) {
  $(this).find('.postmsg > .postsignature').attr('id', 'signature'+index);
  if($(this).find('.postmsg > .postsignature').length !== 0){
    $(this).find('.postfootright > ul').prepend(`<li class="expand" id="expand${index}"><a href="javascript:;">Expand Signature</a></li>`);
    $(this).find('.postfootright > ul > .postreport').prepend('| ')
  }
});

// When the expand element is clicked, add the expanded class to the corresponding signature
// Clicking again removes the expanded class
$(".expand").click(function () {
  var id = this.id.replace("expand", "");
  if($('#signature'+id).hasClass('expanded')){
    $('#signature'+id).removeClass('expanded');
    $(this).html($(this).html().replace("Collapse", "Expand"));
    //console.log("Collapsed signature #"+id);
  } else {
    $('#signature'+id).addClass('expanded');
    $(this).html($(this).html().replace("Expand", "Collapse"));
    //console.log("Expanded signature #"+id);
  }
});
