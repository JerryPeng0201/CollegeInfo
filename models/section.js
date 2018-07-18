const mongoose = require ('mongoose');

var sectionSchema = mongoose.Schema( {
    id: {
      type: String,
      //required: true
    },
    comment: {
      type: String
    },
    course: {
      type: String,
      //required: true
    },
    section: {
      type: String,
      //required: true
    },
    details: {
      type: String
    },
    status: {
      type: String,
      //required: true
    },
    enrolled: {
      type: Number
    },
    limit: {
      type: Number
    },
    waiting: {
      type: Number
    },
    instructors: {
      type: [String],
      //required: true
    },
    times: {
      type: [{
        start: Number,
        end: Number,
        days: {
          type: [String],
          enum:['su', 'm', 'tu', 'w', 'th', 'f', 'sa']
        },
        timeType: String,
        building: String,
        room: String
      }],
      //required: true
    }
  } );

  module.exports = mongoose.model( 'section', sectionSchema );
