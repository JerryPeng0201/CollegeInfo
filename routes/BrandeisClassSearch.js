var express = require('express');
var router = express.Router();
const http = require('http');

// Deploy the models to make index
var Section = require('../models/section');
var Course = require('../models/course');
var Subject = require('../models/subject');
var Term = require('../models/term');
var Instructor = require('../models/term');
var Requirement = require('../models/requirement');

/* GET class search page. */
router.get('/', function(req, res, next) {
  res.render('BrandeisClassSearch', { title: 'Brandeis' });
});

// The use can't access the database so this webpage is for updating
router.get('/update_data', function(req, res){
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
      /*
       * the API from Brandeis is not a database but data
       * so we need to build the index and store them in our own database
       */
      // This part makes index for class type and store them in the database
      for(var data_obj of JSON.parse(final_data)){
        console.log(data_obj);
        // This part makes index for class type and store them in the database
        if(data_obj.type == "section"){
          //check exists
          Section.findOne({id: data_obj.id}, function(err, section){
            console.log(data_obj.id)
            if(err){//Error Report
              res.status(500);
              res.json(err);
              return;
            } else {
              if(!section){//save new section data
                const new_section = new Section(section);
                new_section.save(function(err){
                  if(err){
                    //res.status(500);
                    //res.json(err);
                    return;
                  }
                })
              } else {//update old section data
                Section.update({_id: section._id}, section, function(err){
                  if(err){
                    //res.status(500);
                    //res.json(err);
                    return;
                  }
                })
              }
            }
          })
        }else if(data_obj.type == "course"){
          //check exists
          Course.findOne({id: data_obj.id}, function(err, course){
            console.log(data_obj.id)
            if(err){//Error Report
              //res.status(500);
              //res.json(err);
              return;
            } else {
              if(!course){//save new section data
                const new_course = new Course(course);
                new_course.save(function(err){
                  if(err){
                    //res.status(500);
                    //res.json(err);
                    return;
                  }
                })
              } else {//update old section data
                Course.update({_id: course._id}, course, function(err){
                  if(err){
                    //res.status(500);
                    //res.json(err);
                    return;
                  }
                })
              }
            }
          })
        }else if(data_obj.type == "subject"){
          //check exists
          Subject.findOne({id: data_obj.id}, function(err, subject){
            console.log(data_obj.id)
            if(err){//Error Report
              //res.status(500);
              //res.json(err);
              return;
            } else {
              if(!subject){//save new section data
                const new_subject = new Subject(subject);
                new_subject.save(function(err){
                  if(err){
                    //res.status(500);
                    //res.json(err);
                    return;
                  }
                })
              } else {//update old section data
                Subject.update({_id: subject._id}, subject, function(err){
                  if(err){
                    //res.status(500);
                    //res.json(err);
                    return;
                  }
                })
              }
            }
          })
        }else if(data_obj.type == "term"){
          //check exists
          Term.findOne({id: data_obj.id}, function(err, term){
            console.log(data_obj.id)
            if(err){//Error Report
              //res.status(500);
              //res.json(err);
              return;
            } else {
              if(!term){//save new section data
                const new_term = new Term(term);
                new_term.save(function(err){
                  if(err){
                    //res.status(500);
                    //res.json(err);
                    return;
                  }
                })
              } else {//update old section data
                Term.update({_id: term._id}, term, function(err){
                  if(err){
                    //res.status(500);
                    //res.json(err);
                    return;
                  }
                })
              }
            }
          })
        }else if(data_obj.type == "instructor"){
          //check exists
          Instructor.findOne({id: data_obj.id}, function(err, instructor){
            console.log(data_obj.id)
            if(err){//Error Report
              //res.status(500);
              //res.json(err);
              return;
            } else {
              if(!instructor){//save new section data
                const new_instructor = new Instructor(instructor);
                new_instructor.save(function(err){
                  if(err){
                    //res.status(500);
                    //res.json(err);
                    return;
                  }
                })
              } else {//update old section data
                Instructor.update({_id: instructor._id}, instructor, function(err){
                  if(err){
                    //res.status(500);
                    //res.json(err);
                    return;
                  }
                })
              }
            }
          })
        }else if(data_obj.type == "requirement"){
          //check exists
          Requirement.findOne({id: data_obj.id}, function(err, requirement){
            console.log(data_obj.id)
            if(err){//Error Report
              //res.status(500);
              //res.json(err);
              return;
            } else {
              if(!requirement){//save new section data
                const new_requirement = new Requirement(requirement);
                new_requirement.save(function(err){
                  if(err){
                    //res.status(500);
                    //res.json(err);
                    return;
                  }
                })
              } else {//update old section data
                Requirement.update({_id: requirement._id}, requirement, function(err){
                  if(err){
                    //res.status(500);
                    //res.json(err);
                    return;
                  }
                })
              }
            }
          })
        }
      }
      //res.status(200);
      //res.json({message: "update completed."})
    });
  }).on("error", (err) => {
    console.log("Error: " + err.message);
  });
})

module.exports = router;
