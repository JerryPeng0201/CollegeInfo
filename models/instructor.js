const mongoose = require ('mongoose');

var instructorSchema = mongoose.Schema( {
    id: {
      type: String,
      required: true
    },
    comment: {
      type: String
    },
    first: {
      type: String
    },
    middle: {
      type: String
    },
    last: {
      type: String,
      required: true
    }
  } );

  module.exports = mongoose.model( 'instructor', instructorSchema );
