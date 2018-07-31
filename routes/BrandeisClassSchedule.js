const express = require('express');
const router = express.Router();
const Schedule = require('../models/schedule');
const Section = require('../models/section');
const Course = require('../models/course');
const Instructor = require('../models/instructor');
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
      //console.log("Result-render-check: "+result);
        Section.find({_id: {$in: result.section_list}}, 'section course instructors status enrolled waiting limit times id', function(err, SC_result){
          if(err){
            console.log("Warning: an error is detected." + err);
            res.render('BrandeisClassSchedule', { title: 'Brandeis' , err: err}); //each section in list.section_list
          } else {
            if(SC_result.length == 0){
              console.log("Warning: Searching has no result");
              res.render('BrandeisClassSchedule', {message: "Currently no available sections."})
            } else {
              console.log("Pending... System Normal")
              //console.log("Result-check: "+SC_result)

              const course_id_list = [];
              for(var i = 0; i<SC_result.length; i++){
                //console.log("Course ID: "+SC_result[i].course)
                course_id_list.push(SC_result[i].course);
              }

              const ins_name = [];
              for(var i = 0; i<SC_result.length; i++){
                //console.log("Ins ID: " + SC_result[i].instructors);
                ins_name.push(SC_result[i].instructors);
              }
              //console.log("ins_name check: " + ins_name);

              Instructor.find({'id': {$in: ins_name}}, 'first last id', function(err, INS_result){
                if(err){
                  res.render('BrandeisClassSchedule', {message: err}); //each section in list.section_list
                }else if(INS_result){
                  console.log("Loading the course");

                  //res.render('BrandeisClassSchedule', { title: 'Brandeis' , list: SC_result}); //each section in list.section_list
                  Course.find({'id': {$in: course_id_list}}, 'name code id description', function(err, CO_result){
                    if(err){
                      res.render('BrandeisClassSchedule', {message: err}); //each section in list.section_list
                    }else{
                      //console.log("SC_result: " + SC_result)
                      //console.log("CO_result: " + CO_result)

                      const id_course_map = {};
                      for(var course of CO_result){
                        id_course_map[course.id] = course;
                      }

                      const name_ins_map = {}
                      for(var ins of INS_result){
                        name_ins_map[ins.id] = ins;
                        //console.log("id-check: "+ins)
                      }

                      const SC_list = [];
                      for(var section of SC_result){
                        const section_obj = section.toJSON({
                          virtuals: false,
                          versionKey: false
                        })

                        const array = section_obj.instructors
                        section_obj.course = id_course_map[section_obj.course];
                        console.log(array)
                        for(var i = 0; i < section_obj.instructors.length; i++){
                          //console.log("we're here")
                          //console.log(section_obj.instructors[i])
                          //console.log(name_ins_map[section_obj.instructors[i]])
                          //console.log("length: " + section_obj.length)
                          section_obj.instructors[i] = name_ins_map[section_obj.instructors[i]];
                        }
                        //console.log("final-check-1: "+section_obj.course)
                        console.log("final-check-2: " + section_obj.instructors)
                        SC_list.push(section_obj);
                      }

                      res.render('BrandeisClassSchedule', { title: 'Brandeis' , list: SC_list}); //each section in list.section_list
                    }
                  })//Course.find

                }
              })//Instructor.find


            }
          }
        })//Section.find


    } else {
      res.render('BrandeisClassSchedule', { title: 'Brandeis' }); //each 
    }
  })//Schedule.findOne



});

module.exports = router;
