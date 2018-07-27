$(document).ready(function(){
  $("button#submit-keycode").on('click', function(event){
    console.log("hey!")

    const keycode = $("input#keycode").val();
    $.ajax({
      url: "/update_keycode",
      method: "POST",
      data: {
        keycode: keycode
      },
      success: function(){
        $("#keycode-alert-success").css("display", "block");
        setTimeout(function(){$("#keycode-alert-success").css("display", "none")}, 3000);
      },
      error: function(){
        $("#keycode-alert-warn").css("display", "block");
        setTimeout(function(){$("#keycode-alert-warn").css("display", "none")}, 3000);
      },
    })
  })
})