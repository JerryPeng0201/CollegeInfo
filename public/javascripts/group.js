$(document).ready(function(){
  $("button.group-remove").on('click', function(event){
    const group_id = event.currentTarget.attributes[2].nodeValue;
    $.ajax({
      url: "/Groups/delete/" + group_id,
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