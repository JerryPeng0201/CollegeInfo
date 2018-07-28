var express = require('express');
var router = express.Router();
const http = require('http');
var async = require('async');

// Deploy the models to make index
const Section = require('../models/section');
const Course = require('../models/course');
const Subject = require('../models/subject');
const Term = require('../models/term');
const Instructor = require('../models/instructor');
const Requirement = require('../models/requirement');
const ClassSearch = require('../models/classSearch');

/* GET class search page. */
router.get('/', function(req, res, next) {
  async.parallel({
    term_list: function(callback){
      Term.find({}, 'id name', callback);
    },
    subject_list: function(callback){
      Subject.find({'term': '1043'}, 'id name', callback);
    }
  }, function(err, results){
    if(err){
      next(err)
    } else {/*
      //create a list of unique subjects
      const all_subs = results.subject_list;
      const unique_sub_list = [];
      for(var i = 0; i < all_subs.length; i++){

      }*/
      res.render('BrandeisClassSearch', { title: 'Brandeis', term_list: results.term_list ,subject_list: results.subject_list});
    }
  })
});

router.post('/', function(req, res, next){
  //onsole.log(req.body);
  const dept_code = req.body.subjectBar;
  const dept_regex = new RegExp(dept_code+"$")

  async.parallel({
    term_list: function(callback){
      Term.find({}, 'id name', callback);
    },
    subject_list: function(callback){
      Subject.find({'term':'1043'}, 'id name abbreviation', callback);
    },
    course_list: function(callback){
      Course.find({'term': req.body.termBar, 'subjects.id':{$regex: dept_regex}},
      'name requirements description code independent_study id',
      {sort: {code:1}},
      callback);
    }
  }, function(err, results){
    if(err){
      next(err)
    }else{
      console.log("dept_regex:" + dept_regex)
      console.log("Results: "+results.course_list)
      //console.log("Class Name: "+results.course_list)
      res.render('BrandeisClassSearch', {title: 'Brandeis', term_list: results.term_list ,subject_list: results.subject_list, course_list: results.course_list});
    }
  })
});


// The use can't access the database so this webpage is for updating
router.get('/update_data', function(req, res, next){
  const secret = req.query.secret;
  /*
   * In order to protect the website from attacing, we need to gurantiee the
   * database can update secretly, which means we need a new address to update
   * it. Therefore, we need to set a secreat codeword on terminal base on
   * opearting enviroment. Without the screat codeword, you have no permission
   * to access the database.
   */
  if(secret != process.env.UPDATE_SECRET){
    res.status(503);
    res.json({});
    return;
  }

  const function_list = [];
  /* Old Database(2004-2016)
   * http://registrar-prod-rhel6.unet.brandeis.edu/export/export-2004-2016.json
   */
  // Deploy the API, connect to the Brandeis class data
  http.get('http://registrar-prod-rhel6.unet.brandeis.edu/export/export.json', (resp) => {
    let data = '';

    // A chunk of data has been recieved.
    resp.on('data', (chunk) => {
      data += chunk;
    });

    // The whole response has been received. Print out the result.
    resp.on('end', () => {
      //re-origanize the data formation so that it can match json requirement
      const final_data = "[\n" + data.replace(/}\n{/ig, "},\n{") + "]";
      var count = 0;
      /*
       * the API from Brandeis is not a database but data
       * so we need to build the index and store them in our own database
       */
      // This part makes index for class type and store them in the database
      for(let data_obj of JSON.parse(final_data)){
        // This part makes index for class type and store them in the database
        count ++
        console.log("Number: "+count)
        if(data_obj.type == "section"){
          //check exists
          function_list.push(function(callback){
            Section.findOne({id: data_obj.id}, function(err, section){
              if(err){//Error Report
                callback(err, null);
              } else {
                if(!section){//save new section data
                  for(var i = 0; i < data_obj.times.length; i++){
                    const time = data_obj.times[i];
                    const temp = time.type;
                    delete data_obj.times[i].type;
                    data_obj.times[i].timeType = temp;
                  }

                  const new_section = new Section(data_obj);
                  new_section.save(function(err, doc){
                    if(err){
                      console.log(doc);
                      console.log(data_obj.times);
                      callback(err, null);
                    } else {
                      callback(null);
                    }
                  })
                  console.log("Number_S: "+count)
                } else {//update old section data
                  Section.update({_id: section._id}, section, callback);
                  console.log("Number_SD: "+count)
                }
              }
            })
          })
      }else if(data_obj.type == "course"){
          //check exists
          function_list.push(function(callback){
            Course.findOne({id: data_obj.id}, function(err, course){
              if(err){//Error Report
                callback(err, null);
              } else {
                if(!course){//save new section data
                  const new_course = new Course(data_obj);
                  new_course.save(callback)
                  console.log("Number_C: "+count)
                } else {//update old section data
                  Course.update({_id: course._id}, course, callback);
                  console.log("Number_CD: "+count)
                }
              }
            })
          })
      }else if(data_obj.type == "subject"){
          //check exists
          function_list.push(function(callback){
            Subject.findOne({id: data_obj.id}, function(err, subject){
              if(err){//Error Report
              callback(err, null);
              } else {
                if(!subject){//save new section data
                  const new_subject = new Subject(data_obj);
                  new_subject.save(callback)
                  console.log("Number_SU: "+count)
                } else {//update old section data
                  Subject.update({_id: subject._id}, subject, callback);
                  console.log("Number_SUD: "+count)
                }
              }
            })
          })
        }else if(data_obj.type == "term"){
          //check exists
          function_list.push(function(callback){
            Term.findOne({id: data_obj.id}, function(err, term){
              if(err){//Error Report
                callback(err, null);
              } else {
                if(!term){//save new section data
                  const new_term = new Term(data_obj);
                  new_term.save(callback)
                  console.log("Number_T: "+count)
                } else {//update old section data
                  Term.update({_id: term._id}, term, callback)
                  console.log("Number_TD: "+count)
                }
              }
            })
          })
        }else if(data_obj.type == "instructor"){
          //check exists
          function_list.push(function(callback){
            Instructor.findOne({id: data_obj.id}, function(err, instructor){
              if(err){//Error Report
                callback(err, null);
              } else {
                if(!instructor){//save new section data
                  const new_instructor = new Instructor(data_obj);
                  new_instructor.save(callback)
                  console.log("Number_INS: "+count)
                } else {//update old section data
                  Instructor.update({_id: instructor._id}, instructor, callback)
                  console.log("Number_INSD: "+count)
                }
              }
            })
          })
        }else if(data_obj.type == "requirement"){
          //check exists
          function_list.push(function(callback){
            Requirement.findOne({id: data_obj.id}, function(err, requirement){
              if(err){//Error Report
                callback(err, null);
              } else {
                if(!requirement){//save new section data
                  const new_requirement = new Requirement(data_obj);
                  new_requirement.save(callback)
                  console.log("Number_REQ: "+count)
                } else {//update old section data
                  Requirement.update({_id: requirement._id}, requirement, callback)
                  console.log("Number_REQD: "+count)
                }
              }
            })
          })
        }
      }

      async.series(function_list, function(err){
        console.log("We're here")
        if(err){
          console.log("There is an error")
          console.log(err)
          next(err);
        } else {
          console.log("Mission Complete")
          res.status(200);
          res.json({message: "update completed."})
        }
      })
    })
  }).on("error", (err) => {
    console.log("Error: " + err.message);
  });
});



module.exports = router;
