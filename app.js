const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const session = require("express-session");
const bodyParser = require("body-parser");
const User = require( './models/user' );
const flash = require('connect-flash');

//codes for authentication
// here we set up authentication with passport
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
const passport = require('passport')
const configPassport = require('./config/passport')
configPassport(passport)

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var brandeisHomeRouter = require('./routes/BrandeisHome');
var brandeisClassScheduleRouter = require('./routes/BrandeisClassSchedule');
var brandeisClassSearchRouter = require('./routes/BrandeisClassSearch');


var app = express();

//Test whether the mongoose database can work
const mongoose = require( 'mongoose');
mongoose.connect( 'mongodb://localhost/MemoryTrack' );
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log("we are connected!")
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({ secret: 'zzbbyanana' }));
app.use(flash());
app.use(express.static(path.join(__dirname, 'public')));

//new code for authentication
app.use(passport.initialize());
app.use(passport.session());
app.use(bodyParser.urlencoded({ extended: false }));

// here is where we check on their logged in status
app.use((req,res,next) => {
  res.locals.loggedIn = false
  if (req.isAuthenticated()){
    console.log("user has been Authenticated")
    res.locals.user = req.user
    res.locals.loggedIn = true
    if (req.user){
      if (req.user.googleemail=='tjhickey@brandeis.edu'){
        console.log("Owner has logged in")
        res.locals.status = 'teacher'
      } else {
        console.log('student has logged in')
        res.locals.status = 'student'
      }
    }
  }
  next()
})

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



app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/BrandeisHome', isLoggedIn, brandeisHomeRouter);
app.use('/BrandeisClassSchedule', isLoggedIn, brandeisClassScheduleRouter)
app.use('/BrandeisClassSearch', isLoggedIn, brandeisClassSearchRouter)

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
