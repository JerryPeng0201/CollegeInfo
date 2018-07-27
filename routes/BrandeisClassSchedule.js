var express = require('express');
var router = express.Router();
const Schedule = require('../models/schedule');
const Section = require('../models/section');
const Course = require('../models/course');
const async = require('async');
//const User = require('../models/user')

/* GET home page. */
router.get('/', function(req, res, next) {
  //List.find({_id: {$in: id_list}})
  Schedule.findOne({creator: req.user._id}, 'creator section_list', function(err, result){
    if(err){
      console.log("Warning: an error is detected." + err);
      next(err);
    }else if(result){
      console.log("System Normal")
      console.log("Result-render-check: "+result);
        Section.find({_id: {$in: result.section_list}}, 'section course instructors status enrolled waiting limit times id', function(err, SC_result){
          if(err){
            console.log("Warning: an error is detected." + err);
            res.render('BrandeisClassSchedule', { title: 'Brandeis' , err: err}); //each section in list.section_list
          } else {
            if(SC_result.length == 0){
              console.log("Warning: Searching has no result");
              res.render('BrandeisClassSchedule', { title: 'Brandeis', text: "Currently no available sections.", status: 404})
            } else {
              console.log("Pending... System Normal")
              console.log("Result-check: "+SC_result)
              console.log("section-course: "+SC_result.course)
              const course_id_list = [];
              for(var i = 0; i<SC_result.length; i++){
                console.log("Course ID: "+SC_result[i].course)
                course_id_list.push(SC_result[i].course);
              }

              //res.render('BrandeisClassSchedule', { title: 'Brandeis' , list: SC_result}); //each section in list.section_list
              Course.find({'id': {$in: course_id_list}}, 'name code id description', function(err, CO_result){
                if(err){
                  res.render('BrandeisClassSchedule', { title: 'Brandeis' , err: err}); //each section in list.section_list
                }else{
                  console.log("SC_result: " + SC_result)
                  console.log("CO_result: " + CO_result)

                  const id_course_map = {};
                  for(var course of CO_result){
                    id_course_map[course.id] = course;
                  }

                  const SC_list = [];
                  for(var section of SC_result){
                    const section_obj = section.toJSON({
                      virtuals: false,
                      versionKey: false
                    })

                    section_obj.course = id_course_map[section_obj.course];
                    SC_list.push(section_obj);
                  }

                  res.render('BrandeisClassSchedule', { title: 'Brandeis' , list: SC_list}); //each section in list.section_list
                }
              })
            }
          }
        })//Section.find


    }//else if(result)
  })//Schedule.findOne



});

module.exports = router;
