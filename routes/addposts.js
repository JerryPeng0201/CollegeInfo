var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('addposts', { title: 'Student Market' });
});

router.post('/', function(req, res, next) {
  console.log(req.body.pname);
  console.log(req.body.porigin);
  console.log(req.body.pdes);
  console.log(req.body.pprice);
  res.render('addposts', { title: 'Student Market' });
});

