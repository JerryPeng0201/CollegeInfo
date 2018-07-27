$(document).ready(function(){
  $("button.detail-button").click(function(event) {
    const pname = event.currentTarget.attributes[1].nodeValue;
    const pdes = event.currentTarget.attributes[2].nodeValue;
    $("#exampleModalLong .modal-title").text(pname)
    $("#exampleModalLong .modal-body").text(pdes)
    $("#exampleModalLong").modal("show"); 
  });
})

$(document).ready(function(){
  $("button.delete-button").on('click', function(event){
    console.log("clicked")
    event.preventDefault();
    const doc_id = event.currentTarget.attributes[2].nodeValue;
    console.log(pname);
    $.ajax({
      url: "/posts/" + doc_id + "/delete",
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