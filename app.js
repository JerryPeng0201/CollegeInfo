const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const session = require("express-session");
const bodyParser = require("body-parser");
const User = require( './models/user' );
const flash = require('connect-flash');
const Section = require('./models/section');
const async = require('async');
// const favicon = require('serve-favicon');
// var path = require('path');

var weekday = new Array(7);
weekday[0] = "Sunday";
weekday[1] = "Monday";
weekday[2] = "Tuesday";
weekday[3] = "Wednesday";
weekday[4] = "Thursday";
weekday[5] = "Friday";
weekday[6] = "Saturday";


//codes for authentication
// here we set up authentication with passport
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
const passport = require('passport')
const configPassport = require('./config/passport')
configPassport(passport);

var app = express();
// app.use(favicon(path.join(__dirname,'public','images','favicon.ico')));

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const brandeisHomeRouter = require('./routes/BrandeisHome');
const brandeisClassScheduleRouter = require('./routes/BrandeisClassSchedule');
const brandeisClassSearchRouter = require('./routes/BrandeisClassSearch');
const addpostsRouter = require('./routes/addposts');
const postsController = require('./controllers/postsController');
const contactsController = require('./controllers/contactsController');
const teamRouter = require('./routes/team');
const footertermsRouter = require('./routes/footer-terms');
const api_controller = require('./controllers/api.js');
const brandeisMajorSearchRouter = require('./routes/BrandeisMajorSearch')
const Group = require('./models/group.js');
const Subject = require('./models/subject');
const Term = require('./models/term');
const Course = require('./models/course');
const Schedule = require('./models/schedule');
const Instructor = require("./models/instructor");


//Test whether the mongoose database can work
const mongoose = require( 'mongoose');
const mongoDB = process.env.MONGO_URI || "mongodb://localhost:27017/CollegeInfo";
mongoose.connect( mongoDB, {useNewUrlParser: true});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log("Mongoose Database Normal")
});


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({
  secret: 'zzbbyanana',
  resave: false,
  saveUninitialized: true,
}));
app.use(flash());
app.use(express.static(path.join(__dirname, 'public')));

//new code for authentication
app.use(passport.initialize());
app.use(passport.session());
app.use(bodyParser.urlencoded({ extended: false }));
//app.use(passport_google_check)

// here is where we check on their logged in status
app.use((req,res,next) => {
  res.locals.loggedIn = false
  if (req.isAuthenticated()){
    console.log("user has been Authenticated")
    res.locals.user = req.user
    res.locals.loggedIn = true;
  }
  next()
})

app.use(bodyParser.urlencoded({ extended: true}));

// here are the authentication routes

app.get('/loginerror', function(req,res){
  res.render('loginerror',{})
})

app.get('/login', function(req,res){
  res.render('login',{})
})

// route for logging out
app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });

// =====================================
// GOOGLE ROUTES =======================
// =====================================
// send to google to do the authentication
// profile gets us their basic information including their name
// email gets their emails
app.get('/auth/google', passport.authenticate('google', { scope : ['profile', 'email'] }));

// the callback after google has authenticated the user
app.get('/auth/google/callback',
        passport.authenticate('google', {
                successRedirect : '/BrandeisHome',
                failureRedirect : '/loginerror'
        }));

app.get('/BrandeisHome/authorized',
        passport.authenticate('google', {
                successRedirect : '/BrandeisHome',
                failureRedirect : '/loginerror'
        }));
console.log("Authentication System Normal")

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {
  console.log("checking to see if they are authenticated!")
  // if user is authenticated in the session, carry on
  if (req.isAuthenticated()){
    console.log("user has been Authenticated")
    return next();
  }else{
    console.log("user has not been authenticated...")
    // if they aren't redirect them to the home page
    res.redirect('/login');
  }

}

// we require them to be logged in to see their profile
app.get('/BrandeisHome', isLoggedIn, function(req, res) {
    res.render('BrandeisHome', {
        user : req.user // get the user out of session and pass to template
    });
});

function replyToDiaf(req, res){
  // console.dir(req.body)
  return res.json({
      "fulfillmentMessages": [],
      "fulfillmentText": res.locals.output_string,
      "payload":{"slack":{"text":res.locals.output_string}},
      "outputContexts": [],
      "source": "Text Source",
      "followupEventInput":{}
    });

}


/*
 * This part is for the speaking control part.
 * The speaking control part provides a platform for user to search class database
 * by spekaing the keyword of the class, like name, time, instructor, etc. We use
 * DialogFlow to edit the intents and entities to train the system. The user need to
 * give a sentence first, like "I want to find a class offered by Computer Science Department
 * from 8 to 10 in the fall semester". The core information is "tiem-period", "department name",
 * and "term". If the user miss any piece of these information, the system will keep asking
 * until the user provide all core information.
 */

 // This function processes the request and return the right respond
let sessions = {};

function dayShortToDayLong(day){
  if(day == 'm') return "Monday";
  if(day == 'tu') return "Tuesday";
  if(day == 'w') return "Wednesday";
  if(day == 'th') return "Thursday";
  if(day == 'f') return "Friday";
}

function dateToNumber(date){
  let convertedTime = date.getMinutes() + date.getHours()*60;
  return convertedTime;
}

function numberToString(minutes){
  let convertedTimeString;
  if (minutes % 60 ==0){
    convertedTimeString = minutes/60 + ":00";
  }else{
    convertedTimeString = Math.floor(minutes/60) + ":" + minutes%60;
  }
  return convertedTimeString;
}

function process_request(req, res, next){
  //console.dir(req.body.queryResult.parameters);
  res.locals.output_string = "there was an error";
  var temp = "";
  console.log("in the processing")
  sessions[req.body.session]= sessions[req.body.session] || {};
  //console.dir(sessions);
  let session = sessions[req.body.session];

  //==================================== Dialogflow ========================================
  var list = ""
   // Run this part of code when the intent is "how_many_class_I_have"
   if(req.body.queryResult.intent.displayName == "how_many_class_I_have"){
     /*
      * This part is keycode identification. The user need to say his or her own special
      * keycode to authorized it. The keycode could be created on GUI page. When the users
      * is trying to access his or her own schedule and market Database, he or she will be
      * required to provide keycode; The part of codes on following is the functions require
      * authentication
      */
     const keycode = req.body.queryResult.parameters.keycode;
     console.log(keycode);
     User.findOne({keycode: keycode}, function(err, user_doc){
       if(err){
         res.locals.output_string = "There are errors courses";
         next();
         return;
       } else {
         if(user_doc){
           session.user_id = user_doc._id;
         } else {
           session.user_id = 0;
           //tell the user he doesn't have an account yet
           res.locals.output_string = "There are errors courses";
           next();
           return;
         }
         var user_id = session.user_id;
         console.log("user_id-check: " + user_id);

         // use the keycode to locate the user's information and find user's section_list
         Schedule.findOne({'creator': user_id}, 'section_list', function(err, schedule_doc){
           console.log("schedule: " + schedule_doc);
           if(err){
             console.log(err);
             res.locals.output_string = "There are errors courses";
             next();
             return;
           }else if(!schedule_doc){
             session.section_list = 0;
             //tell user he doesn't have a scheldule
             res.locals.output_string = "There are errors courses";
             next();
             return;
           }else{
             session.section_list = schedule_doc.section_list;

             //"How many classes i need to take for this semester?"
             if(req.body.queryResult.parameters['Term']){
               if(session.section_list){
                 Section.find({_id:{$in:session.section_list}}, 'times course id', function(err, section_list){
                   if(err){
                     res.locals.output_string = "There are errors courses";
                     next();
                     return;
                   }else if(section_list.length != 0){
                     // create an array to store information in section_info, which is an array object
                     var section_info_course = [];
                     for(var i = 0; i<section_list.length; i++){
                       section_info_course.push(section_list[i].course);
                     }
                     //Find the courses via section_info.course id
                     Course.find({id:{$in:section_info_course}}, 'name code id', function(err, course_list){
                       if(err){
                         res.locals.output_string = "There are errors courses";
                         next();
                         return;
                       }else if(course_list){
                         const class_detail_name = [];
                         for(var i = 0; i< course_list.length; i++){
                           class_detail_name.push(course_list[i].name)
                         }
                         res.locals.output_string = "You have " + section_list.length + " sections in this semester. The courses' names are " + class_detail_name;
                          next();
                          return;
                       }
                     })//Course.find
                   }//else if(section_info)
                 })//Section.find
               }
             } else if(req.body.queryResult.parameters['date']){ // "How many classes i have on Monday?"
               if(session.section_list){
                 Section.find({_id:{$in:session.section_list}}, 'times course id', function(err, section_list){
                   if(err){
                     res.locals.output_string = "There are errors courses";
                     next();
                     return;
                   }else if(section_list){
                     //get the date that the user wants to check
                     const day = req.body.queryResult.parameters['date'];
                     console.log("The date is " + day);
                     var Dday = new Date(day);
                     console.log("the day is "+Dday);
                     let day_code = "";
                     const today = new Date(); //get today
                     //var current_date = today.getDay();

                     // change the date to lower case code so that we can compare it with the database
                     if (Dday.getDay() == 2 || Dday.getDay() == 4){
                       day_code = weekday[Dday.getDay()].substring(0,2).toLowerCase();
                     }else{
                       day_code = weekday[Dday.getDay()].substring(0,1).toLowerCase();
                     }

                     const class_detail = [];
                     for(var i = 0; i < section_list.length; i++){
                       for(var time of section_list[i].times){
                         for(var _day of time.days){
                          if(day_code == _day){
                            class_detail.push(section_list[i].course)
                          }
                         }
                       }
                     }
                     if(class_detail.length == 0){
                       res.locals.output_string = "You don't have any classes on that day.";
                       next();
                       return;
                     }
                     //find those section's course name
                     Course.find({id:{$in:class_detail}}, 'name code id', function(err, course_doc){
                       if(err){
                         res.locals.output_string = "There are errors courses";
                         next();
                         return;
                       }else if(course_doc.length!=0){
                         const class_detail_name = [];
                         for(var i = 0; i< course_doc.length; i++){
                           class_detail_name.push(course_doc[i].name)
                         }
                         res.locals.output_string = "On " + day + ", you have " + class_detail.length + "classes. The courses' names are " + class_detail_name;
                         next();
                         return;
                       }
                     })


                   }//else if(section_info)
                 })//Section.find
               }
             }else if(req.body.queryResult.parameters['Next']){//"What is my next class?"
               if(session.section_list){
                 var today = new Date(); //get today
                 //var current_day = today.getDay();
                 var current_timeHours = today.getHours();
                 var current_timeMinutes = today.getMinutes();
                 var current_timeNumber = current_timeHours*60 + current_timeMinutes;

                 if (today.getDay() == 2 || today.getDay() == 4){
                   day_code = weekday[today.getDay()].substring(0,2).toLowerCase();
                 }else{
                   day_code = weekday[today.getDay()].substring(0,1).toLowerCase();
                 }

                 Section.find({_id:{$in:session.section_list}}, 'times course id', function(err,section_list){
                   if(err){
                     res.locals.output_string = "There are errors courses";
                     next();
                     return;
                   }else if(section_list.length!=0){
                     const next_class = [];
                     for(var i = 0; i < section_list.length; i++){
                      for(time of section_list[i].times){
                        if(current_timeNumber < time.start){
                          for(day of time.days){
                            if(day_code == day){
                              next_class.push(section_list[i].course);
                            }
                          }
                        }
                      }
                     }//for loop
                     if(next_class.length == 0){
                       res.locals.output_string = "You have no more class today.";
                       next();
                       return;
                     }
                     //find the course name;
                     Course.find({id:{$in:next_class}}, 'name code id', function(err, next_course){
                       if(err){
                         res.locals.output_string = "There are errors courses";
                         next();
                         return;
                       }else if(next_course.length!=0){
                         const course_name = [];
                         for(var i = 0; i<next_class.length; i++){
                           course_name.push(next_course[i].name);
                         }
                         res.locals.output_string = "Your next class is " + course_name;
                         next();
                         return;
                       }

                     })// Course.find
                   }
                 })//Section.find
               }


             } else {
               res.locals.output_string = "Something went wrong.";
               next();
               return;
             }


           }
         })//Schedule.find


       }
     })//User.findOne
   }else if(req.body.queryResult.intent.displayName == "how_many_total"){
    console.log("how many triggered");
    Section.count()
      .exec()
      .then((num) => {
        console.log("in next(num)" + num);
        res.locals.output_string = "There are " + num + " courses";
        session.department = "all";
        next();
        return;
      })
      .catch((err) => {
        console.log("err");
        console.dir(err);
        res.locals.output_string = "There was an error.";
        next();
        return;
      })
  }else if(req.body.queryResult.intent.displayName == "which_classes_at_time"){
    console.log("which classes at time triggered");
    console.dir(req.body);
    const date = req.body.queryResult.parameters['date'];
    //clear old data
    if(session){
      delete session.course_list_result;
      delete session.section_query;
      delete session.found_sections;
    }
    console.log("date = " + date);
    var d = new Date(date);
    console.dir(d);
    let factor = "";

    if (d.getDay()==2 || d.getDay()==4){
      factor = weekday[d.getDay()].substring(0,2).toLowerCase();
    }else{
      factor = weekday[d.getDay()].substring(0,1).toLowerCase();
    }
    const current_date = new Date();
    var term = req.body.queryResult.parameters.Term;
    //get term

    //term --> get section
    var current_term_code = "";
    var course_id_list = [];
    var sub_id = "";
    var course_list_result = "";
    var converted_Time_String_Start = "";
    var converted_Time_String_End = "";
    var courseBrief = "";
    async.series([
      function(callback){
        if(!term){
          Term.findOne({start: {$lte: current_date}, end: {$gte: current_date}}, function(err, term_doc){
            console.log("term_doc: "+term_doc)
            if(err){
              console.log(err);
              callback(err, null);
            } else if(term_doc.name.includes("Summer")){
              //change the term to the next one
              current_term_code = term_doc.id.substring(0, 3) + (parseInt(term_doc.id.substring(3)) + 1);
              callback(null, null);
            } else {
              current_term_code = term_doc.id;
              callback(null, null);
            }
          })
        } else {
          callback(null, null);
        }
      },
      function(callback){
        const section_id_regex = new RegExp("^" + current_term_code + "-");

        const section_query = {
          "times.days":factor,
          id: {$regex: section_id_regex},
        };

        if(req.body.queryResult.parameters["time-period"]){
          console.log("We're in time period function!")
          let time_period = req.body.queryResult.parameters["time-period"];
          let startTime = dateToNumber(new Date(time_period.startTime));
          let endTime = dateToNumber(new Date(time_period.endTime));

          function process_time(time){
            if(time > 1200){
              return time -= 720;
            } else if(time < 480){
              return time += 720;
            } else {
              return time;
            }
          }
          var processed_startTime = process_time(startTime);
          var processed_endTime = process_time(endTime);

          if(processed_endTime > processed_startTime) {
            var temp = processed_endTime;
            processed_endTime = processed_startTime;
            processed_startTime = temp;
          }

          if(processed_endTime < processed_startTime){
            converted_Time_String_Start = numberToString(new Number(processed_endTime));
            converted_Time_String_End = numberToString(new Number(processed_startTime));
          } else {
            converted_Time_String_Start = numberToString(new Number(processed_startTime));
            converted_Time_String_End = numberToString(new Number(processed_endTime));
          }

          console.log(converted_Time_String_Start);
          console.log(converted_Time_String_End);

          section_query["times.end"] = {$gte: processed_endTime};
          section_query["times.start"] = {$lte: processed_startTime};
        }

        session.section_query = section_query;

        if(req.body.queryResult.parameters["Subject"]){
          console.log("We're in the subject function")
          //console.log("subject: "+req.body.queryResult.parameters["Subject"])
          var sub_name = req.body.queryResult.parameters["Subject"];
          console.log("sub_name: "+sub_name);
          Subject.findOne({name: sub_name}, 'id', function(err, subject_doc){
            if(err){
              console.log(err);
              callback(err, null);
            }else if(subject_doc){
              sub_id = subject_doc;
              console.log("subject id: " + sub_id);
              Section.distinct('course', section_query, function(err, id_list){
                if(err){
                  callback(err, null);
                } else {
                  course_id_list = id_list;
                  console.log(id_list)
                  callback(null, null);
                }
              })
            } else {
              res.locals.output_string = "Sorry we can't find the major.";
              next();
              return;
            }
          })
        }
      },
      function(callback){
        const sub_regex = new RegExp(sub_id.id.substring(sub_id.id.indexOf("-") + 1) + "$");
        Course.find({id: {$in: course_id_list}, "subjects.id": {$regex: sub_regex}}, function(err, course_list){
          if(err){
            callback(err, null);
          }else{
            course_list_result = course_list;
            session.course_list_result = course_list;
            console.log("***********************************************")
            console.log(session.course_list_result);
            callback(null, null);
          }
        })
      }
    ], function(err, results){
      if(err){
        console.log(err);
        res.locals.output_string = "Something went wrong...";
      } else {
        for (index=0; index<course_list_result.length; index++){
          courseBrief += index+1 + ". " + course_list_result[index].code + "-" + course_list_result[index].name + "\n";
        }
        console.log("courseBreif: " + courseBrief);
        courseBrief += " .You can say \"tell me more about the first one\" to check course details."
        if (req.body.queryResult.parameters["time-period"]){
          res.locals.output_string = "We have found " + course_list_result.length + " classes offered by " + req.body.queryResult.parameters["Subject"]+ " Department" +" on "+weekday[d.getDay()] +
          " from " + converted_Time_String_Start + ":" + " to " + converted_Time_String_End +
          " for you! " + "\n"
          + "They are: " + "\n" +
          courseBrief;
        }else{
          res.locals.output_string = "We have found " + course_list_result.length + " classes offered by " + req.body.queryResult.parameters["Subject"]+ " Department" +" on "+weekday[d.getDay()] +
          " from " + "8:00" + " to 21:30" +
          " for you! " + "\n"
          + "They are: " + "\n" +
          courseBrief;
        }
      }
      next();
    })
  }else if (req.body.queryResult.intent.displayName == "which_classes_at_time_detail"){
    console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^");
    console.log(session.course_list_result);

    let courseDetail = "";
    let detail_index = req.body.queryResult.parameters["index"] - 1;
    courseDetail+= session.course_list_result[detail_index].code + " - " + session.course_list_result[detail_index].name + "\n"
      + "requirements: " + session.course_list_result[detail_index].requirements + "\n"
      + "course description: " + session.course_list_result[detail_index].description +"\n"
      + "Say \"show me the sections\" to see the available sections that match your request."

    res.locals.output_string = courseDetail;
    session.checked_course = session.course_list_result[detail_index];
    next();
  } else if(req.body.queryResult.intent.displayName == "which_classes_at_time_detail_section"){
    console.log("We're in which_classes_at_time_detail_section!")
    //check data
    if(!session || !session.course_list_result){
      res.locals.output_string = "You haven't searched any course yet. For example, say \"which math courses are on Monday from 2 to 3\".";
      next();
    } else {
      if(!session.checked_course) {
        res.locals.output_string = "You didn't choose any course from the search result. For example, say \"show me the details of number one\".";
        next();
      } else {
        const course_doc = session.checked_course;
        const section_query = session.section_query;
        section_query.course = course_doc.id;
        //console.log(section_query);
        Section.find(section_query, function(err, section_list){
          if(err){
            res.locals.output_string = "Something went wrong...";
            console.log(err);
            next()
          } else {
            //find instructor
            const processed_section_result = [];
            const instructor_query_list = [];
            for(let section of section_list){
              instructor_query_list.push(function(callback){
                const ins_list = section.instructors;
                Instructor.find({id: {$in: ins_list}}, function(err, ins_result){
                  if(err){
                    callback(err, null);
                  } else {
                    const section_obj = section.toJSON({
                      virtuals: false,
                      versionKey: false,
                    })

                    section_obj.instructors = ins_result;
                    processed_section_result.push(section_obj);
                    callback(null, null);
                  }
                })
              })
            }

            async.parallel(instructor_query_list, function(err, result){
              if(err){
                res.locals.output_string = "Something went wrong...";
                console.log(err);
                next();
              } else {
                var index = 1;
                var final_output = "";
                for(var section of processed_section_result){
                  const section_num = section.section;
                  const ins_name_list = [];
                  for(var instructor of section.instructors){
                    ins_name_list.push(`${instructor.first} ${instructor.last}`);
                  }

                  var section_info = "";
                  for(var time of section.times){
                    const days = [];
                    var day_index = 0;
                    const day_num_map = {
                      m: 1,
                      tu: 2,
                      w: 3,
                      th: 4,
                      f: 5
                    }
                    for(var day of time.days.sort(function(a, b){return day_num_map[a] - day_num_map[b]})){
                      if(day_index == 0){
                        days.push(dayShortToDayLong(day));
                      } else if(day_index < time.days.length - 1){
                        days.push(" " + dayShortToDayLong(day));
                      } else {
                        days.push(" and " + dayShortToDayLong(day));
                      }
                      day_index++;
                    }

                    const location = `${time.building} ${time.room}`;
                    const start_time = numberToString(time.start);
                    const end_time = numberToString(time.end);

                    const section_output = (!time.building || !time.room)? `On ${days}, from ${start_time} to ${end_time}, but the classroom is to be determined. \n` : `On ${days}, in ${location}, from ${start_time} to ${end_time} \n`;
                    section_info += section_output;
                  }

                  const section_info_output = `Section number ${index} is taught by ${ins_name_list}, and its times and locations are the following. ${section_info} \n`;
                  final_output += section_info_output;
                  index++;
                }

                res.locals.output_string = 'Here are the sections I found: '
                  + final_output
                  + " If you want to add any of the sections to your schedule, you can say \"add the first\".";
                session.found_sections = processed_section_result;
                next();
              }
            })
          }
        })
      }
    }
  } else if (req.body.queryResult.intent.displayName == "which_classes_at_time_detail_section_add"){
    const keycode = req.body.queryResult.parameters.keycode.toLowerCase();
    const section_index = req.body.queryResult.parameters.detail_index - 1;

    if(!keycode){
      res.locals.output_string = "Please say your keycode.";
      next();
      return;
    }

    if(!session || !session.course_list_result){
      res.locals.output_string = "You haven't searched any course yet. For example, say \"which math courses are on Monday from 2 to 3\".";
      next();
      return;
    }

    if(!session.checked_course) {
      res.locals.output_string = "You didn't choose any course from the search result. For example, say \"show me the details of number one\".";
      next();
      return;
    }

    if(!session.found_sections){
      res.locals.output_string = "You didn't search any sections for a course. You can say \"show me the sections\""
      next();
      return;
    }

    User.findOne({keycode: keycode}, function(err, user_doc){
      if(err){
        res.locals.output_string = "Something went wrong...";
        next();
      } else {
        if(!user_doc){
          res.locals.output_string = "I can't find your information, please try again.";
          next()
        } else {
          Schedule.findOne({creator: user_doc._id}, function(err, schedule_doc){
            if(err){
              res.locals.output_string = "Something went wrong...";
              next()
            } else {
              if(!session.found_sections[section_index]){
                res.locals.output_string = "Sorry, I didn't find that section.";
                next();
                return;
              }
              const new_section_id = session.found_sections[section_index]._id;
              if(schedule_doc){
                for(var section_id of schedule_doc.section_list){
                  if(section_id.toString() == new_section_id.toString()){
                    res.locals.output_string = "It's already in your schedule. You're all set.";
                    next();
                    return;
                  }
                }

                schedule_doc.section_list.push(new_section_id);
                schedule_doc.save(function(err){
                  if(err){
                    res.locals.output_string = "Something went wrong...";
                    next();
                  } else {
                    res.locals.output_string = "Done! You're all set.";
                    next();
                  }
                })
              } else {
                const new_schedule = new Schedule({
                  creator: user_doc._id,
                  section_list: [new_section_id]
                })

                new_schedule.save(function(err){
                  if(err){
                    res.locals.output_string = "Something went wrong...";
                    next();
                  } else {
                    res.locals.output_string = "Done! You're all set.";
                    next();
                  }
                })
              }
            }
          })
        }
      }
    })
  }else if (req.body.queryResult.intent.displayName == "help"){
    res.locals.output_string = "If you want to search for courses that fit your schedule, say something like \"What courses offered by Math Department are from 10 to 2 on Monday?\" "+"\n " +
    "If you want to search for items for sale, please say something like \"Laptop for sale\" " + "\n" +
    "If you want to add certain course to schedule, search for the course that meets your requirements, then in the result list, specify the course or say something like \"add the first course to my schedule\""+ "\n"+
    "If your want to find out your own schedule, say something like \"What's my next course?\", or \"What's my schedule today\" " + "\n" +
    "To get access to the full functions on your own schedule operation, please login to our website https://college-info.herokuapp.com , where you can create your own unique keycode for this voice version of CollegeInfo Bot, explore more features we have. If you want to have a visual version of your current schedule, please go to https://college-info.herokuapp.com as well." ;
    next();
  } else if (req.body.queryResult.intent.displayName == "who_designed") {
    res.locals.output_string = "Jierui Peng, Jialin Zhou, and Xuxin Zhang";
    next();
  } else if(req.body.queryResult.intent.displayName == "help"){
    res.locals.output_string = "You can say something like \"Which classes are offered by Computer Science Department from 8 to 11 am on Wednesday?\" ";
    next();
  } else {
    res.locals.output_string = "Oops, something went wrong... Could you please rephrase your request? You can say \"help\" for detailed support";
    next();
  }
}



  //get term

  //term --> get section

  //start & end time --> get section

  //section --> get course

  //subject --> get course
//======================================= Dialogflow Ends =====================================


app.post('/hook', process_request, replyToDiaf);

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/BrandeisHome', isLoggedIn, brandeisHomeRouter);
app.use('/BrandeisClassSchedule', isLoggedIn, brandeisClassScheduleRouter)
app.post('/add_section_to_schedule', isLoggedIn, api_controller.add_section_to_schedule)
app.use('/BrandeisClassSearch', isLoggedIn, brandeisClassSearchRouter)
app.post('/get_section_data', isLoggedIn, api_controller.get_section_data_post);
app.post('/delete_section_data', isLoggedIn, api_controller.delete_section_data);
app.use('/team', teamRouter)
app.use('/footer-terms', footertermsRouter)
app.use('/BrandeisMajorSearch', isLoggedIn, brandeisMajorSearchRouter)

app.get('/addposts', isLoggedIn,function(req,res){
 console.log("adding posts")
 res.render('addposts',{})
});
app.post('/addposts', isLoggedIn, postsController.savePosts)
app.get('/posts', isLoggedIn, postsController.getAllPosts );
app.post('/posts', isLoggedIn, postsController.filterPosts);
app.get('/posts/:id', isLoggedIn, postsController.attachPdes, postsController.getPdes);
app.get('/myposts', isLoggedIn, postsController.myPosts);
app.post('/myposts/:post_id/delete', isLoggedIn, postsController.deletePost);

app.get('/chatroom', isLoggedIn, function(req, res){
  res.render('chatroom', {})
});

app.get('/Groups', isLoggedIn, function(req, res){
  Group.find({}, function(err, group_list){
    if(err){
      res.status(err.status || 500);
      res.json(err);
    } else {
      res.render("Groups", {
        title: "groups",
        Groups: group_list,
      });
    }
  })
});

app.get('/Groups/addGroups', isLoggedIn, function(req, res){
  res.render('addGroups');
})

app.post('/Groups/addGroups', isLoggedIn, function(req, res){
  const group_name = req.body.name.trim();
  if(!group_name){
    res.status(400);
    res.json({message: "Please enter a name for the group"})
    return;
  } else if(typeof group_name != "string"){
    res.status(400);
    res.json({message: "Please enter a valid group name"});
    return;
  }

  const group = {
    name: req.body.name,
    createdAt: new Date(),
    locked: false,
  }

  const new_group = new Group(group);
  new_group.save(function(err){
    if(err){
      res.status(err.status || 500);
      res.json(err);
    } else {
      res.redirect('/Groups');
    }
  })
})

//add grous for each subject
if(process.env.GENERATE_GROUP == "true"){
  const group_list = [];
  Subject.distinct('name',{}, function(err, result){
    for(var subject_name of result){
      const group = {
        name: "Discussion group for " + subject_name,
        createdAt: new Date(),
        locked: true,
      }

      const new_group = new Group(group);
      group_list.push(new_group);

      var sorted_group_list = group_list.sort(function(a,b){
        return new Date(Date.parse(a.CreatedAt)) - new Date(Date.parse(b.CreatedAt));
    });
    }

    Group.insertMany(sorted_group_list, function(err, group_list){
      if(err){
        console.log(err);
      } else {
        console.log("Subject groups successfully generated.")
      }
    })
  })
}


app.post('/Groups/delete/:id', isLoggedIn, function(req, res){
  Group.findByIdAndRemove(req.params.id, function(err){
    if(err){
      res.status(err.status || 500);
      res.json(err);
    } else {
      res.json({});
    }
  })
})

//////////////
//change later
app.get('/profile', isLoggedIn, function(req, res){
  res.render('profile', {user:req.user})
})

app.post('/update_keycode', isLoggedIn, function(req, res){
  const keycode = req.body.keycode.toLowerCase();

  var checkWord = require('check-word'),
      words     = checkWord('en');

  if(typeof keycode != 'string'){
    res.status(400);
    res.json({message: "Please enter a valid keycode."});
    return;
  }

  if(keycode.trim().length == 0){
    res.status(400);
    res.json({message: "Please enter a keycode."});
    return;
  }

  const word_list = keycode.split(/ +/);
  for(var i = 0; i < word_list.length; i++){
    if(!word_list[i]) continue;
    if(!words.check(word_list[i].toLowerCase())){
      res.status(400);
      res.json({message: "Please enter a readable keycode."});
      return;
    }
  }

  User.findOne({keycode: keycode}, function(err, doc){
    if(err){
      res.status(err.status || 500);
      res.json(err);
    } else {
      if(doc){
        if(doc._id.toString() == req.user._id.toString()){
          res.json({});
        } else {
          res.status(400);
          res.json({message: `Keycode has been used.`});
        }
      } else {
        User.findById(req.user._id, function(err, user_doc){
          if(err){
            res.status(err.status || 500);
            res.json(err);
          } else {
            user_doc.keycode = keycode;
            user_doc.save(function(err){
              if(err){
                res.status(err.status || 500);
                res.json(err);
              } else {
                res.json({});
              }
            })
          }
        })
      }
    }
  })


})

//////////////

//For contact us page
app.get('/contacts', function(req,res){
  console.log("adding contacts")
  res.render('contacts',{})
 });
// app.get('/contacts', contactsController.savePosts)

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});


// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
console.log("System Normal")
