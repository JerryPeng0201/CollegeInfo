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
          console.log("doc_list: " + doc_list[0].instructors)

          const ins_name=[];
          for(var i = 0; i<doc_list.length; i++){
            console.log("ins id: " + doc_list[i].instructors);
            ins_name.push(doc_list[i].instructors);
          }
          console.log("ins_name: " + ins_name);


          Instructor.find({id: {$in: ins_name}}, 'first last email', function(err, result){
            if(err){
              console.log("err: " + err)
            }else if(result){
              //console.log("result" + result);
              //console.log("doc_list" + doc_list);

              const name_ins_map = {}
              for(var ins of result){
                name_ins_map[ins.id] = ins;
              }
              //console.log("name_ins_map: " + name_ins_map);

              const section_list = [];
              for(var section of doc_list){
                const section_obj = section.toJSON({
                  virtuals: false,
                  versionKey: false
                })
                section_obj.ins = name_ins_map[section_obj.ins];
                section_list.push(section_obj);
              } //for loop
              res.json({text: section_list, status:200})
            }
          })


          //res.json({text: doc_list, status:200})
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


exports.delete_section_data = function(req, res, next){
  const Schedule = require('../models/schedule');
  const Section = require('../models/section');
  const Coursr = require('../models/course');
  const section_delete_id = req.body.section_delete;
  console.log("section_delete_id: "+section_delete_id);

  Section.findOne({_id: section_delete_id}, function(err, result){
    if(err){
      console.log("err: "+err);
    }else if(result){
      console.log("Loading the delete function");
      Schedule.findOne({creator:req.user._id, section_list: section_delete_id}, function(err, schedule){
        if(err){
          console.log("err: "+err);
        }else if(schedule){
          const new_section_list = [];
          for(var section of schedule.section_list){
            if(section.toString() != section_delete_id){
              new_section_list.push(section);
            }
          }

          schedule.section_list = new_section_list;
          schedule.save(function(err){
            if(err){
              console.log(err);
            } else {
              res.json({});
            }
          })
        }
      })
    }
  });//section.findone
} //exports.delete_section_data
