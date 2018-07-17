const mongoose = require ('mongoose');

var subjectSchema = mongoose.Schema( {
    id: {
      type: String,
      //required: true
    },
    comment: {
      type: String
    },
    term: {
      type: String,
      //required: true
    },
    name: {
      type: String,
      //required: true
    },
    abbreviation: {
      type: String,
      //required: true
    },
    segments: [{
      id: String,
      name: String
    }]
  } );

  module.exports = mongoose.model( 'subject', subjectSchema );
