$(document).ready(function(){
  $("button.detail-button").click(function(event) {
    console.log("detail clicekd");
    console.log($(event.currentTarget));
    const pname = event.currentTarget.attributes[1].nodeValue;
    const pdes = event.currentTarget.attributes[2].nodeValue;
    const pcon = event.currentTarget.attributes[3].nodeValue;
    $("#exampleModalLong .modal-title").text(pname)
    $("#exampleModalLong .body1").text(pdes)
    $("#exampleModalLong .body2").text(pcon)
    $("#exampleModalLong").modal("show"); 
  });
})

$(document).ready(function(){
  $("button.delete-button").on('click', function(event){
    console.log("clicked")
    event.preventDefault();
    const doc_id = event.currentTarget.attributes[2].nodeValue;
    $.ajax({
      url: "/myposts/" + doc_id + "/delete",
      type: "POST",
      dataType: 'json',
      success: function(){
        window.location = '';
      },
      error: function(err){
        window.alert(err.responseText);
      },
    })
  })
})