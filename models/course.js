const mongoose = require ('mongoose');

var courseSchema = mongoose.Schema( {
    id: {
      type: String,
      required: true
    },
    comment: {
      type: String
    },
    term: {
      type: String,
      required: true
    },
    code: {
      type: String,
      required: true
    },
    subjects: [{
      id: String,
      segment: String
    }],
    continuity_id: {
      type: String
    },
    name: {
      type: String,
      required: true
    },
    description: {
      type: String
    },
    credits: {
      type: Number
    },
    independent_study: {
      type: Boolean,
      required: true
    },
    requirements: {
      type: [String],
      required: true
    }
  } );

  module.exports = mongoose.model( 'course', courseSchema );
