$(document).ready(function(){

  $("#mytable tr.course_box").on('click', function(event){
    console.log($(event.currentTarget));
    const course_description = event.currentTarget.attributes[1].nodeValue;
    const course_title = event.currentTarget.attributes[2].nodeValue;
    console.log("clicked!");
    //feed data
    $("#exampleModal .course-description").text(course_description)
    $("#exampleModal .course-title").text(course_title)

    //show modal
    $('#exampleModal').modal('show')
  })
  console.log("hey")
})
