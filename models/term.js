const mongoose = require ('mongoose');

var termSchema = mongoose.Schema( {
    id: {
      type: String,
      //required: true
    },
    comment: {
      type: String
    },
    name: {
      type: String,
      //required: true
    },
    start: {
      type: Date,
      //required: true
    },
    end: {
      type: Date,
      //required: true
    }
  } );

  module.exports = mongoose.model( 'term', termSchema );
