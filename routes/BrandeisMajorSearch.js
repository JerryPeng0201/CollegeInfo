const express = require('express');
const router = express.Router();
const Department = require('../models/department');
const DepartmentREQ = require('../models/departmentREQ');
const MajorSearch = require('../models/majorSearch');


router.get('/', function(req, res, next) {
  Department.find({}, 'name id', function(err, department_list){
    if(err){
      console.log("err: " + err)
    }else if(department_list){
      console.log("result-check: " + department_list)
      res.render('BrandeisMajorSearch', { title: 'About us', list:department_list});
    }
  })

});

router.post('/', function(req, res, next){
  Department.find({}, 'name', function(err, department_list){
    if(err){
      console.log("err: " + err)
    }else if(department_list){
      console.log("result-check: " + department_list)
      console.log("departmentBar: " + req.body.departmentBar.toString())

      DepartmentREQ.find({}, 'name id honors', function(err, reqs_result){
        if(err){
          console.log("err: "+err);
        }else if(reqs_result){
          console.log("department-result: "+reqs_result);
          res.render('BrandeisMajorSearch', { title: 'About us', result:reqs_result, list:department_list});
        }
      })

    }
  })


})

module.exports = router;
