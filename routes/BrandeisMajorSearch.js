const express = require('express');
const router = express.Router();
const Department = require('../models/department');
const DepartmentREQ = require('../models/departmentREQ');


router.get('/', function(req, res, next) {
  Department.find({}, 'name', function(err, result){
    if(err){
      console.log("err: " + err)
    }else if(result){
      console.log("result-check: " + result)
      res.render('BrandeisMajorSearch', { title: 'About us', list:result});
    }
  })

});

module.exports = router;
