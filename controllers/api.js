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
  res.json({})
}
