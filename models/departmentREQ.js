const mongoose = require ('mongoose');

var departmentREQSchema = mongoose.Schema( {
    name: {
      type: String,
      //required: true
    },
    id: {
      type: String,
    },
    minor: {
      type: [{
        compulsory: String,
        electives: String,
        grade: String,
        pass: String,
        comment: String
      }]
    },
    major: {
      type: [{
        ba: {
          type: [{
            compulsory: String,
            electives: String,
            comment: String
          }]
        },
        bs: {
          type: [{
            compulsory: String,
            electives: String,
            grade: String,
            pass: String,
            comment: String
          }]
        }
      }]
    },
    honors: {
      type: String
    }
  } );

  module.exports = mongoose.model( 'departmentREQ', departmentREQSchema );
