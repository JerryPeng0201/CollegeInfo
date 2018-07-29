
const mongoose = require ('mongoose');

var majorSearchSchema = mongoose.Schema( {
    majorBar: String
  } );

  module.exports = mongoose.model( 'majorSearch', majorSearchSchema );
