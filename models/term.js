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
      type: String,
      //required: true
    },
    end: {
      type: String,
      //required: true
    }
  } );

  module.exports = mongoose.model( 'term', termSchema );
