const mongoose = require ('mongoose');

var requirementSchema = mongoose.Schema( {
    id: {
      type: String,
      required: true
    },
    comment: {
      type: String
    },
    long: {
      type: String,
      required: true
    },
    short: {
      type: String,
      required: true
    }
  } );

  module.exports = mongoose.model( 'requirement', requirementSchema );
