$(document).ready(function(){

  $("#mytable tr.course_box").on('click', function(event){
    console.log($(event.currentTarget));
    const course_description = event.currentTarget.attributes[1].nodeValue;
    const course_title = event.currentTarget.attributes[2].nodeValue;
    const course_section = event.currentTarget.attributes[3].nodeValue;
    console.log("clicked!");
    //feed data
    $("#exampleModal .course-description").text(course_description)
    $("#exampleModal .course-title").text(course_title)

    //get section data
    $.ajax({
      url: "/get_section_data/",
      type: "POST",
      data: {
        course_id: course_section,
      },
      dataType: 'json',
      success: function(data){
        for(i=0; i<data.text.length; i++){
          $("#exampleModal .course-section").text(data.text[i].section);
          $("#exampleModal .course-instructors").text(data.text[i].instructors);
          $("#exampleModal .course-status").text(data.text[i].status);
          $("#exampleModal .course-enrolled").text(data.text[i].enrolled);
          $("#exampleModal .course-waiting").text(data.text[i].waiting);
          $("#exampleModal .course-limit").text(data.text[i].limit);
          $("#exampleModal .course-date").text(data.text[i].times[i].days);
          $("#exampleModal .course-start").text(data.text[i].times[i].start);
          $("#exampleModal .course-end").text(data.text[i].times[i].end);
          $("#exampleModal .course-building").text(data.text[i].times[i].building);
          $("#exampleModal .course-room").text(data.text[i].times[i].room);
        }
      },
      error: function(err){
        $("#exampleModal .course-section").text(err.responseText);
      }
    })

    //show modal
    $(".course-section").text("Loading...")
    $('#exampleModal').modal('show')
  })
  console.log("hey")
})
