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

function replyToDiaf(req, res, next){
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
function process_request(req, res, next){
  //console.dir(req.body.queryResult.parameters);
  res.locals.output_string = "there was an error";
  var temp = "";
  console.log("in the processing")
  sessions[req.body.session]= sessions[req.body.session] || {};
  console.dir(sessions);
  let session = sessions[req.body.session];
  console.dir(session);
  console.log("before user find one");
  //if getKeycode
  let keycode = 0;
  /*
   * This part is keycode identification. The user need to say his or her own special
   * keycode to authorized it. The keycode could be created on GUI page.
   */

   if(req.body.queryResult.intent.displayName == "schedule"){
     User.findOne({keycode: keycode}, function(err, user_doc){
       if(err){
         res.status(err.status || 500);
         res.json(err);
       } else {
         if(user_doc){
           session.user_id = user_doc._id;
         } else {
           session.user_id = 0;
         }
         keycode = session.user_id;
         console.log("keycode-check: " + keycode);

         Schedule.find({'creator': keycode}, 'section_list', function(err, total_section){
           console.log("total_section: " + total_section);
           if(err){
             console.log(err);
           }else if(total_section.length == 0){
             res.locals.output_string = "You didn't add any class";
           }else{
             res.locals.output_string = "You have " + total_section.length + "classs";
           }
         })//Schedule.find

       }
     })//User.findOne
   }

  //============================================================================

  console.log("before if");

  if(req.body.queryResult.intent.displayName == "how_many_total"){
    console.log("how many triggered");
    Section.count()
      .exec()
      .then((num) => {
        console.log("in next(num)" + num);
        res.locals.output_string = "There are " + num + " courses";
        session.department = "all";
        next();
      })
      .catch((err) => {
        console.log("err");
        console.dir(err);
        res.locals.output_string = "There was an error.";
        next();
      })
  }else if(req.body.queryResult.intent.displayName == "which_classes_at_time"){
    console.log("which classes at time triggered");
    console.dir(req.body);
    const date = req.body.queryResult.parameters['date'];
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

          section_query["times.end"] = {$lte: processed_endTime};
          section_query["times.start"] = {$gte: processed_startTime};
        }

        if(req.body.queryResult.parameters["Subject"]){
          console.log("We're in the subject function")
          //console.log("subject: "+req.body.queryResult.parameters["Subject"])
          var sub_name = req.body.queryResult.parameters["Subject"];
          console.log("sub_name: "+sub_name);
          Subject.findOne({name: sub_name}, 'id', function(err, subject_doc){
            if(err){
              console.log(err);
            }else if(subject_doc){
              sub_id = subject_doc;
              console.log("subject id: " + sub_id);
              Section.distinct('course', section_query, function(err, id_list){
                if(err){
                  callback(err, null);
                } else {
                  course_id_list = id_list;
                  callback(null, null);
                }
              })
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
            callback(null, null);
            //console.log(course_list_result);
          }
        })
      }
    ], function(err, results){
      if(err){
        console.log(err);
        res.locals.output_string = "Something went wrong...";
      } else {
        console.log('***** about to print the result')
        console.log(course_list_result);
        for (index=0; index<course_list_result.length; index++){
          courseBrief += course_list_result[index].code + "-" + course_list_result[index].name + "\n";
        }
        console.log("courseBreif: " + courseBrief);
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
  }else if (req.body.intent.displayName == "help"){
    res.locals.output_string = "If you want to search for courses that fit your schedule, say something like \"What courses offered by Math Department are from 10 to 2 on Monday?\" "+"\n " +
    "If you want to search for items for sale, please say something like \"Laptop for sale\" " + "\n" +
    "If you want to add certain course to schedule, search for the course that meets your requirements, then in the result list, specify the course or say something like \"add the first course to my schedule\""+ "\n"+
    "If your want to find out your own schedule, say something like \"What's my next course?\", or \"What's my schedule today\" " + "\n" +
    "To get access to the full functions on your own schedule operation, please login to our website https://college-info.herokuapp.com , where you can create your own unique keycode for this voice version of CollegeInfo Bot, explore more features we have. If you want to have a visual version of your current schedule, please go to https://college-info.herokuapp.com as well." ;
  } else if (req.body.queryResult.intent.displayName == "who_designed") {
    res.locals.output_string = "Jierui Peng, Jialin Zhou, and Xuxin Zhang";
    next();
  } else if(req.body.queryResult.intent.displayName == "help"){
    res.locals.output_string = "You can say something like \"Which classes are offered by Computer Science Department from 8 to 11 am on Wednesday?\" ";
  } else {
    res.locals.output_string = "Oops, something went wrong... Could you please rephrase your request? You can say \"help\" for detailed support";
  }
}



  //get term

  //term --> get section

  //start & end time --> get section

  //section --> get course

  //subject --> get course











let sessions = {};

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
