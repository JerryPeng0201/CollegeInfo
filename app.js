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

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var brandeisHomeRouter = require('./routes/BrandeisHome');
var brandeisClassScheduleRouter = require('./routes/BrandeisClassSchedule');
var brandeisClassSearchRouter = require('./routes/BrandeisClassSearch');
var addpostsRouter = require('./routes/addposts');
var postsController = require('./controllers/postsController');
var contactsController = require('./controllers/contactsController');
var teamRouter = require('./routes/team');
var footertermsRouter = require('./routes/footer-terms');
var api_controller = require('./controllers/api.js');
var brandeisMajorSearchRouter = require('./routes/BrandeisMajorSearch')
var Group = require('./models/group.js');
var Subject = require('./models/subject');


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


function process_request(req, res, next){
  console.dir(req.body);
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
    }
  })

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

      res.locals.output_string = "Lots of classes on "+weekday[d.getDay()];

      next();
    }
  else{
    console.log("else");
    res.locals.output_string = "We did";
    next();
  }
}

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
app.use('/BrandeisMajorSearch', brandeisMajorSearchRouter)

app.get('/addposts', isLoggedIn,function(req,res){
 console.log("adding posts")
 res.render('addposts',{})
});
app.post('/addposts', isLoggedIn, postsController.savePosts)
//app.use('/addposts', isLoggedIn, addpostsRouter);
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
  const keycode = req.body.keycode;

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
          res.json({message: "Keycode used."});
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
