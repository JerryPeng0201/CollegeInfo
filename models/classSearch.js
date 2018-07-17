'use strict';
const mongoose = require ('mongoose');

var classSearchSchema = mongoose.Schema( {
    termBar: String,
    subjectBar: String
  } );

  module.exports = mongoose.model( 'classSearch', classSearchSchema );
