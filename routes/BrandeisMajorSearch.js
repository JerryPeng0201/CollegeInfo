var express = require('express');
var router = express.Router();


router.get('/', function(req, res, next) {
  res.render('BrandeisMajorSearch', { title: 'About us' });
});

module.exports = router;
