var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var brandeisHomeRouter = require('./routes/BrandeisHome');
var brandeisClassScheduleRouter = require('./routes/BrandeisClassSchedule');
var addpostsRouter = require('./routes/addposts');
var postsController = require('./controllers/postsController');
const bodyParser = require("body-parser")
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

const
mongoose = require( 'mongoose' );
mongoose.connect( 'mongodb://localhost/shopat' );
const 
db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log("we are connected!")
});

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/BrandeisHome', brandeisHomeRouter);
app.use('/BrandeisClassSchedule', brandeisClassScheduleRouter)

app.get('/addposts', function(req,res){
  console.log("adding posts")
  res.render('addposts',{})
});
app.post('/addposts', postsController.savePosts)
app.use('/addposts', addpostsRouter);
app.get('/posts', postsController.getAllPosts );
app.get('/posts/:id',
        postsController.attachPdes,
        postsController.getPdes)
        
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
