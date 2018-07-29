const mongoose = require ('mongoose');

var departmentREQSchema = mongoose.Schema( {
    name: {
      type: String,
      //required: true
    },
    minor: [{
      compulsory: String,
      electives: String,
      grade: String,
      pass: String,
      comment: String
    }],
    major: [{
      ba: [{
        compulsory: String,
        electives: String,
        comment: String
      }],
      bs: [{
        compulsory: String,
        electives: String,
        grade: String,
        pass: String,
        comment: String
      }]
    }],
    honors: String
  } );

  module.exports = mongoose.model( 'departmentREQ', departmentREQSchema );
