
$(document).ready(function(){

  $('#sectionSchedule .checkTable').on('click', function(event){
    console.log("Delete box is clicked!")
    console.log($(event.currentTarget));
    const section_delete_id = event.currentTarget.attributes[1].nodeValue;
    console.log("section_delete_id: " + section_delete_id);

    $.ajax({
      url: "/delete_section_data/",
      type: "POST",
      data: {
        section_delete: section_delete_id
      },//data
      dataType: "json",
      success: function(data){
        window.alert("The section has been deleted \n" + "Please reload the page to check your new schedule");
      },error: function(err){
        console.log("There is an error")
        console.log(err);
      }
    })//ajax

  })//$('#sectionSchedule .checkTable').on('click', function(event

}) //$(document).ready(function(
