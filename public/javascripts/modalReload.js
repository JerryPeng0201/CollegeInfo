$(document).ready(function(){
  $("button.detail-button").click(function(event) {
    const pname = event.currentTarget.attributes[1].nodeValue;
    const pdes = event.currentTarget.attributes[1].nodeValue;
    $("#exampleModalLong .modal-title").text(pname)
    $("#exampleModalLong .modal-body").text(pdes)
    $("#exampleModalLong").modal("show"); 
  });
})