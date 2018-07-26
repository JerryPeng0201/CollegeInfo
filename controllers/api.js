console.log("API Controller Normal")
exports.get_section_data_post = function(req, res, next){
  const course_id = req.body.course_id;
  const Section = require('../models/section');
  const Instructor = require('../models/instructor');
    Section.find({'course': course_id}, 'section instructors status enrolled waiting limit times id', function(err, doc_list){
      if(err){
        res.json({text: err.message, status: 500});
      } else {
        if(doc_list.length == 0){
          res.json({text: "Currently no available sections.", status: 404})
        } else {
          res.json({text: doc_list, status:200})
        }
      }
    })

    //Instructor.find({'id': })
}

exports.add_section_to_schedule = function(req, res, next){
  const section_id = req.body.section_id;
  const Section = require('../models/section');
  const Schedule = require('../models/schedule')
  var async = require('async')
  var section_obj = '';
  var term = '';

  console.log("section_id: " + section_id)
  Section.findOne({'id': section_id}, function(err, section_result){
    if(err){
      next(err)
      console.log("error: "+err)
    }else if(section_result){
      console.log("Loading the second function")//There is a bug here. result._id is not defined
      Schedule.findOne({'creator': req.user._id}, function(err, section_final){
        if(err){
          res.json({err: err})
        } else {
          if(section_final){ //{$push:{section_list: section_obj._id}}
            console.log("Find the creator, detecting")
            console.log("final: "+section_final);
            console.log("result: "+section_result)
            //const section_list = section_final.section_list;
            //check exists
            for(i = 0; i<section_final.section_list.length; i++){
              if(section_result._id.toString() == section_final.section_list[i]){
                console.log("Detected the same section")
                res.json({notice: "This section has been added"});
                return;
              }
            } //for loop

            Schedule.update({'creator': req.user._id}, {$push:{section_list: section_result._id}}, function(err, result){
              if(err){
                res.json({err: "Warning: an error is detected"})
              }else if(result){
                console.log("Updating the new section")
                res.json({notice: "Update Completed"});
              }
            })
          }else{
              const new_schedule = new Schedule({
                creator: req.user._id,
                section_list: [section_result._id]
              })

              new_schedule.save(function(err, result){
                console.log("Saving the section, pending...")
                if(err){
                  res.json({err: "Warning: an error is detected"})
                }else if(result){
                  console.log("Result: "+result)
                  res.json({});
                }
            })
          }
        } //else statement
      })
    }
  })
} //export.add_section_to_schedule
