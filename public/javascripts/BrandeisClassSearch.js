
$(document).ready(function(){

  //let course_section = "";
  //let course_title = "";
  //let course_description = "";

  /*
   * July 24, 2018
   * 基本思路：
   *     After solving the bugs of click function, we need to finish the ajax part
   * section id = event.currentTarget.attributes[i].nodeValue. Find the "i" from
   * google chrom inspect.
   *     Then go to api.js to add another function to store and get the data from
   * the section selected by the user. Use the section id to find the specific
   * section to fulfull the user's requirement. Then go to app.js to finish
   * app.post part.
   *     There is also a bug in there. The instructor shows the their id number.
   * but we need it shows the name of the instrocutors. Therefore, we need to connect
   * with the database again and find the name of the instructor
   *
   * Files need to improve:
   * app.js, api.js, BrandeisClassSchedule.pug, BrandeisClassSearch.js(javascript)
   */

  $("#exampleModal").on('show.bs.modal', function (e) {
    $("#sectionDetail tr.loading").css("display", "block");
  })



  $("#mytable tr.course_box").on('click', function(event){
    console.log($(event.currentTarget));
    const course_description = event.currentTarget.attributes[1].nodeValue;
    const course_title = event.currentTarget.attributes[2].nodeValue;
    const course_section = event.currentTarget.attributes[3].nodeValue;
    console.log("course_box is clicked!");
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
        function process_time(time){
          var final_time;
          //if time == "TBD"
          if(time % 60 == 0){
            final_time=Math.floor(time / 60) + ": 00"
          }else if(time % 60 !== 0){
            final_time = Math.floor(time / 60) + ": " + (time % 60)
          }else if(time == false){
            final_time = "TBD"
          }
          return final_time;
        }

        function emptyDay(days){
          if(!days){
            return "TBD"
          }else{
            return data.text[i].times[i].days
          }
        }

        function emptyStart(start){
          if(!start){
            return "TBD"
          }else{
            return process_time(data.text[i].times[i].start)
          }
        }

        function emptyEnd(end){
          if(!end){
            return "TBD"
          }else{
            return process_time(data.text[i].times[i].end)
          }
        }

        function emptyBuilding(building){
          if(!building){
            return "TBD"
          }else{
            return data.text[i].times[i].building
          }
        }

        function emptyRoom(room){
          if(!room){
            return "TBD"
          }else{
            return data.text[i].times[i].room
          }
        }

        $("#sectionDetail tr.loading").css("display", "none");
        function addSectionTr(id, section, instructors, status, enrolled, waiting, limit, days, start, end, building, room){
          const tr = `<tr section_id=${id} class="sectionInfo" > section_details
                <td>
                    <p class="course-section">${id.substring(id.indexOf("-")+1)}</p>
                </td>
                <td>
                    <p class="course-instructors">${instructors}</p>
                </td>
                <td>
                    <p class="course-status">${status}</p>
                </td>
                <td>
                    <p class="course-limit">${enrolled}</p>
                </td>
                <td>
                    <p class="course-enrolled">${waiting}</p>
                </td>
                <td>
                    <p class="course-waiting">${limit}</p>
                </td>
                <td>
                    <p><b>Days:</b></p>
                    <p class="course-date">${days}</p>
                    <p><b>Start From:</b></p>
                    <p class="course-start">${start}</p>
                    <p><b>End At:</b></p>
                    <p class="course-end">${end}</p>
                </td>
                <td>
                    <p><b>Building:</b></p>
                    <p class="course-building">${building}</p>
                    <p><b>Room:</b></p>
                    <p class="course-room">${room}</p>
                </td>
            </tr>
          `
          $(tr).appendTo(".section-table");
        }
        $("#sectionDetail tr.sectionInfo").remove();
        for(i=0; i<data.text.length; i++){
          addSectionTr(
            data.text[i].id,
            data.text[i].section,
            data.text[i].instructors,
            data.text[i].status,
            data.text[i].enrolled,
            data.text[i].waiting,
            data.text[i].limit,
            emptyDay(data.text[i].times[i]),
            emptyStart(data.text[i].times[i]),
            emptyEnd(data.text[i].times[i]),
            emptyBuilding(data.text[i].times[i]),
            emptyRoom(data.text[i].times[i])
          );
        }

        $("#sectionDetail tr.sectionInfo").on('click', function(event){
          console.log("addclass is clicked!");
          console.log($(event.currentTarget));

          const section_id = event.currentTarget.attributes[0].nodeValue;
          console.log("section_id: " + section_id);

          $.ajax({
            url: "/add_section_to_schedule/",
            type: "POST",
            data: {
              section_id: section_id
            },
            dataType: 'json',
            success: function(data){
              window.alert("Section added successfully.");
            },error: function(err){
              console.log("There's an error");
              console.log(err)
              //$("#sectionSchedule .id").text(err.responseText);
            }

          })
        })
      },
      error: function(err){
        $("#exampleModal .course-section").text(err.responseText);
      }
    })

    //show modal
    $(".course-section").text("Loading...")
    $('#exampleModal').modal('show')
    /*
    $.ajax({
      url:"/section_detail",
      data: {
        course_id: course_section
      },
      type: "POST",
      success: function(data){

      }
    })*/

    //router.post('/section_detail', function(req, res){
      //req.body
    })
  })
  console.log("hey")
